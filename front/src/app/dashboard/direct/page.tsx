'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, Square, Shield, Radio, Clock,
  Target, AlertTriangle, CircleDot,
  Trash2, ChevronLeft, Check, X, Timer,
  ShieldAlert, Crosshair, TrendingDown, Users,
} from 'lucide-react';
import {
  matchService,
  Match,
  MatchDetail,
  MatchPlayerEntry,
  MatchEventEntry,
  MatchEventType,
  FieldZone,
  BodyPart,
  CreateMatchEventPayload,
} from '@/services/matchService';
import { Team } from '@/services/teamService';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OpponentEvent {
  id: string;
  event_type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD';
  minute: number;
  jersey_number: string;
  isOpponent: true;
}

type TimelineItem =
  | (MatchEventEntry & { isOpponent?: false })
  | OpponentEvent;

// ─── Constants ──────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<MatchEventType, {
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}> = {
  GOAL: {
    label: 'But',
    shortLabel: 'But',
    icon: <Target className="w-4 h-4" />,
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
    border: 'border-accent-green/30',
  },
  ASSIST: {
    label: 'Passe décisive',
    shortLabel: 'Passe D.',
    icon: <CircleDot className="w-4 h-4" />,
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
    border: 'border-accent-blue/30',
  },
  YELLOW_CARD: {
    label: 'Carton jaune',
    shortLabel: 'C. Jaune',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  RED_CARD: {
    label: 'Carton rouge',
    shortLabel: 'C. Rouge',
    icon: <ShieldAlert className="w-4 h-4" />,
    color: 'text-accent-red',
    bg: 'bg-accent-red/10',
    border: 'border-accent-red/30',
  },
  RECOVERY: {
    label: 'Récupération',
    shortLabel: 'Récup.',
    icon: <Crosshair className="w-4 h-4" />,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
  },
  BALL_LOSS: {
    label: 'Perte de balle',
    shortLabel: 'Perte',
    icon: <TrendingDown className="w-4 h-4" />,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
};

const QUICK_EVENTS: MatchEventType[] = ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'RECOVERY', 'BALL_LOSS'];
const OPPONENT_EVENTS: ('GOAL' | 'YELLOW_CARD' | 'RED_CARD')[] = ['GOAL', 'YELLOW_CARD', 'RED_CARD'];

const ZONE_CONFIG: { key: FieldZone; label: string }[] = [
  { key: 'DEF_LEFT', label: 'Déf. Gauche' },
  { key: 'DEF_CENTER', label: 'Déf. Centre' },
  { key: 'DEF_RIGHT', label: 'Déf. Droite' },
  { key: 'MID_LEFT', label: 'Mil. Gauche' },
  { key: 'MID_CENTER', label: 'Mil. Centre' },
  { key: 'MID_RIGHT', label: 'Mil. Droite' },
  { key: 'ATT_LEFT', label: 'Att. Gauche' },
  { key: 'ATT_CENTER', label: 'Att. Centre' },
  { key: 'ATT_RIGHT', label: 'Att. Droite' },
  { key: 'BOX', label: 'Surface' },
  { key: 'OUTSIDE', label: 'Extérieur' },
  // Legacy kept for display of old data
  { key: 'LEFT', label: 'Gauche' },
  { key: 'RIGHT', label: 'Droite' },
  { key: 'AXIS', label: 'Axe' },
];

const BODY_PART_CONFIG: { key: BodyPart; label: string }[] = [
  { key: 'LEFT_FOOT', label: 'Pied gauche' },
  { key: 'RIGHT_FOOT', label: 'Pied droit' },
  { key: 'HEAD', label: 'Tête' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatChrono(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatChronoMinute(seconds: number): number {
  return Math.floor(seconds / 60);
}

function generateLocalId(): string {
  return `opp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function LivePulse() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-green" />
    </span>
  );
}

/* ── Match selector ────────────────────────────────────────────────────── */

function MatchSelector({
  matches,
  teamName,
  onSelect,
}: {
  matches: Match[];
  teamName: string;
  onSelect: (m: Match) => void;
}) {
  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const upcomingMatches = matches.filter(m => m.status === 'UPCOMING');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Radio className="w-10 h-10 text-accent-green mx-auto mb-3" />
        <h2 className="text-xl font-bold text-dark dark:text-white">Mode Direct</h2>
        <p className="text-sm text-dark-light/60 dark:text-neutral/50 mt-1">
          Sélectionnez un match pour commencer le suivi en direct
        </p>
      </div>

      {liveMatches.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <LivePulse />
            <h3 className="text-sm font-semibold text-accent-green uppercase tracking-wide">
              En cours ({liveMatches.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {liveMatches.map(m => (
              <button
                key={m.id}
                onClick={() => onSelect(m)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-dark-lighter border border-accent-green/30 rounded-2xl text-left hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-accent-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-dark dark:text-white truncate">
                    {teamName} vs {m.opponent}
                  </p>
                  <p className="text-xs text-accent-green font-medium flex items-center gap-1.5 mt-0.5">
                    <LivePulse /> En cours
                  </p>
                </div>
                <Play className="w-4 h-4 text-accent-green group-hover:scale-110 transition-transform" />
              </button>
            ))}
          </div>
        </section>
      )}

      {upcomingMatches.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-dark-light/60 dark:text-neutral/60 uppercase tracking-wide mb-3">
            À venir ({upcomingMatches.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingMatches.map(m => (
              <button
                key={m.id}
                onClick={() => onSelect(m)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-2xl text-left hover:border-accent-green/30 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-accent-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-dark dark:text-white truncate">
                    {teamName} vs {m.opponent}
                  </p>
                  <p className="text-xs text-dark-light/50 dark:text-neutral/50 mt-0.5">
                    {new Date(m.match_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {m.location === 'HOME' ? 'Domicile' : 'Extérieur'}
                  </p>
                </div>
                <Play className="w-4 h-4 text-dark-light/30 dark:text-neutral/30 group-hover:text-accent-green transition-colors" />
              </button>
            ))}
          </div>
        </section>
      )}

      {liveMatches.length === 0 && upcomingMatches.length === 0 && (
        <div className="text-center py-12">
          <p className="text-dark-light/60 dark:text-neutral/50 text-sm">
            Aucun match en direct ou à venir.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Player Picker Modal ──────────────────────────────────────────────── */

function PlayerPickerOverlay({
  players,
  onSelect,
  onClose,
}: {
  players: MatchPlayerEntry[];
  onSelect: (playerId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const starters = players.filter(p => p.status === 'STARTER');
  const substitutes = players.filter(p => p.status === 'SUBSTITUTE');

  const filterBySearch = (list: MatchPlayerEntry[]) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      p =>
        p.player.first_name.toLowerCase().includes(q) ||
        p.player.last_name.toLowerCase().includes(q) ||
        (p.player.jersey_number?.toString() || '').includes(q)
    );
  };

  const positionLabel = (pos?: string) => {
    switch (pos) {
      case 'GOALKEEPER': return 'G';
      case 'DEFENDER': return 'D';
      case 'MIDFIELDER': return 'M';
      case 'FORWARD': return 'A';
      default: return '';
    }
  };

  const PlayerButton = ({ mp }: { mp: MatchPlayerEntry }) => (
    <button
      onClick={() => onSelect(mp.player_id)}
      className="flex items-center gap-3 p-3 bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-xl hover:border-accent-green/40 hover:shadow-sm transition-all text-left group"
    >
      <div className="w-9 h-9 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green font-bold text-sm shrink-0">
        {mp.player.jersey_number ?? '–'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dark dark:text-white truncate">
          {mp.player.first_name} {mp.player.last_name}
        </p>
        {mp.player.position && (
          <span className="text-[10px] text-dark-light/50 dark:text-neutral/50 uppercase">
            {positionLabel(mp.player.position)}
          </span>
        )}
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-lightest dark:bg-dark-secondary rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-neutral/20 dark:border-dark-light">
          <h3 className="text-base font-bold text-dark dark:text-white">Choisir un joueur</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral/10 dark:hover:bg-dark-light transition-colors">
            <X className="w-4 h-4 text-dark-light dark:text-neutral" />
          </button>
        </div>
        <div className="px-5 pt-4 pb-2">
          <input
            type="text"
            placeholder="Rechercher un joueur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            className="w-full px-3 py-2.5 bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light text-dark dark:text-white placeholder:text-dark-light/40 dark:placeholder:text-neutral/40 rounded-xl text-sm outline-none focus:border-accent-green transition-colors"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {filterBySearch(starters).length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-accent-green uppercase tracking-wide mb-2">Titulaires</p>
              <div className="grid grid-cols-2 gap-2">
                {filterBySearch(starters).map(mp => <PlayerButton key={mp.player_id} mp={mp} />)}
              </div>
            </div>
          )}
          {filterBySearch(substitutes).length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-dark-light/60 dark:text-neutral/60 uppercase tracking-wide mb-2">Remplaçants</p>
              <div className="grid grid-cols-2 gap-2">
                {filterBySearch(substitutes).map(mp => <PlayerButton key={mp.player_id} mp={mp} />)}
              </div>
            </div>
          )}
          {filterBySearch(starters).length === 0 && filterBySearch(substitutes).length === 0 && (
            <p className="text-center text-dark-light/50 dark:text-neutral/50 text-sm py-6">Aucun joueur trouvé</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Opponent Jersey Number Input ─────────────────────────────────────── */

function OpponentJerseyOverlay({
  eventType,
  onSubmit,
  onClose,
}: {
  eventType: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD';
  onSubmit: (jersey: string) => void;
  onClose: () => void;
}) {
  const [jersey, setJersey] = useState('');
  const cfg = EVENT_CONFIG[eventType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-lightest dark:bg-dark-secondary rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-neutral/20 dark:border-dark-light">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
              <span className={cfg.color}>{cfg.icon}</span>
            </div>
            <h3 className="text-base font-bold text-dark dark:text-white">{cfg.label} adverse</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral/10 dark:hover:bg-dark-light transition-colors">
            <X className="w-4 h-4 text-dark-light dark:text-neutral" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-dark-light/60 dark:text-neutral/60 mb-1.5 block">
              N° du joueur adverse (optionnel)
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ex: 9"
              value={jersey}
              onChange={e => setJersey(e.target.value.replace(/\D/g, '').slice(0, 3))}
              autoFocus
              className="w-full px-3 py-3 bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light text-dark dark:text-white placeholder:text-dark-light/40 dark:placeholder:text-neutral/40 rounded-xl text-lg text-center font-bold outline-none focus:border-accent-red transition-colors"
            />
          </div>
          <button
            onClick={() => onSubmit(jersey)}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-accent-red text-white hover:bg-accent-red/90 transition-colors"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Zone Picker — Visual Pitch ───────────────────────────────────────── */

function ZonePickerOverlay({
  onSelect,
  onSkip,
  onClose,
}: {
  onSelect: (zone: FieldZone) => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  // 3x3 grid zones
  const gridZones: { key: FieldZone; label: string; row: number; col: number }[] = [
    { key: 'ATT_LEFT',   label: 'Att.\nGauche',  row: 0, col: 0 },
    { key: 'ATT_CENTER', label: 'Att.\nCentre',  row: 0, col: 1 },
    { key: 'ATT_RIGHT',  label: 'Att.\nDroite',  row: 0, col: 2 },
    { key: 'MID_LEFT',   label: 'Mil.\nGauche',  row: 1, col: 0 },
    { key: 'MID_CENTER', label: 'Mil.\nCentre',  row: 1, col: 1 },
    { key: 'MID_RIGHT',  label: 'Mil.\nDroite',  row: 1, col: 2 },
    { key: 'DEF_LEFT',   label: 'Déf.\nGauche',  row: 2, col: 0 },
    { key: 'DEF_CENTER', label: 'Déf.\nCentre',  row: 2, col: 1 },
    { key: 'DEF_RIGHT',  label: 'Déf.\nDroite',  row: 2, col: 2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-lightest dark:bg-dark-secondary rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-neutral/20 dark:border-dark-light">
          <h3 className="text-base font-bold text-dark dark:text-white">Zone du terrain</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral/10 dark:hover:bg-dark-light transition-colors">
            <X className="w-4 h-4 text-dark-light dark:text-neutral" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Pitch visual */}
          <div className="relative w-full bg-emerald-600/10 dark:bg-emerald-900/20 border-2 border-emerald-500/30 rounded-xl overflow-hidden">
            {/* Goal area (opponent) */}
            <div className="flex justify-center py-1">
              <div className="w-16 h-1.5 rounded-b bg-emerald-500/20" />
            </div>

            {/* 3x3 grid */}
            <div className="grid grid-cols-3">
              {gridZones.map(zone => (
                <button
                  key={zone.key}
                  onClick={() => onSelect(zone.key)}
                  onMouseEnter={() => setHovered(zone.key)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative aspect-[4/3] flex items-center justify-center border border-emerald-500/15 transition-all ${
                    hovered === zone.key
                      ? 'bg-accent-green/20'
                      : 'hover:bg-accent-green/10'
                  }`}
                >
                  <span className={`text-[10px] font-semibold text-center leading-tight whitespace-pre-line transition-colors ${
                    hovered === zone.key
                      ? 'text-accent-green'
                      : 'text-dark-light/45 dark:text-neutral/45'
                  }`}>
                    {zone.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Middle line */}
            <div className="absolute top-[calc(33.33%+4px)] left-0 right-0 border-t border-dashed border-emerald-500/20 pointer-events-none" />
            <div className="absolute top-[calc(66.66%+4px)] left-0 right-0 border-t border-dashed border-emerald-500/20 pointer-events-none" />

            {/* Goal area (ours) */}
            <div className="flex justify-center py-1">
              <div className="w-16 h-1.5 rounded-t bg-emerald-500/20" />
            </div>
          </div>

          {/* Box + Outside */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelect('BOX')}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-emerald-500/20 text-sm font-medium text-dark-light dark:text-neutral hover:bg-accent-green/10 hover:text-accent-green hover:border-accent-green/30 transition-all"
            >
              <Target className="w-3.5 h-3.5" />
              Surface
            </button>
            <button
              onClick={() => onSelect('OUTSIDE')}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-neutral/20 dark:border-dark-light text-sm font-medium text-dark-light dark:text-neutral hover:bg-neutral/5 dark:hover:bg-dark-lighter transition-colors"
            >
              Extérieur
            </button>
          </div>

          {/* Skip */}
          <button
            onClick={onSkip}
            className="w-full py-2 text-xs text-dark-light/40 dark:text-neutral/40 hover:text-dark-light dark:hover:text-neutral transition-colors"
          >
            Passer (pas de zone)
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Body Part Picker — Stick Figure ──────────────────────────────────── */

function BodyPartPickerOverlay({
  onSelect,
  onSkip,
  onClose,
}: {
  onSelect: (part: BodyPart) => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-lightest dark:bg-dark-secondary rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-neutral/20 dark:border-dark-light">
          <h3 className="text-base font-bold text-dark dark:text-white">Partie du corps</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral/10 dark:hover:bg-dark-light transition-colors">
            <X className="w-4 h-4 text-dark-light dark:text-neutral" />
          </button>
        </div>

        <div className="p-5">
          {/* Stick figure SVG */}
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 200 320" className="w-44 h-64" xmlns="http://www.w3.org/2000/svg">
              {/* Body lines (non-interactive) */}
              {/* Neck */}
              <line x1="100" y1="55" x2="100" y2="80" className="stroke-dark-light/20 dark:stroke-neutral/20" strokeWidth="3" strokeLinecap="round" />
              {/* Torso */}
              <line x1="100" y1="80" x2="100" y2="165" className="stroke-dark-light/20 dark:stroke-neutral/20" strokeWidth="3" strokeLinecap="round" />
              {/* Left arm */}
              <line x1="100" y1="95" x2="55" y2="140" className="stroke-dark-light/20 dark:stroke-neutral/20" strokeWidth="3" strokeLinecap="round" />
              {/* Right arm */}
              <line x1="100" y1="95" x2="145" y2="140" className="stroke-dark-light/20 dark:stroke-neutral/20" strokeWidth="3" strokeLinecap="round" />
              {/* Left leg */}
              <line x1="100" y1="165" x2="65" y2="255" className="stroke-dark-light/20 dark:stroke-neutral/20" strokeWidth="3" strokeLinecap="round" />
              {/* Right leg */}
              <line x1="100" y1="165" x2="135" y2="255" className="stroke-dark-light/20 dark:stroke-neutral/20" strokeWidth="3" strokeLinecap="round" />

              {/* HEAD — clickable */}
              <g
                onClick={() => onSelect('HEAD')}
                onMouseEnter={() => setHovered('HEAD')}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <circle
                  cx="100" cy="32" r="26"
                  className={`transition-all duration-150 ${
                    hovered === 'HEAD'
                      ? 'fill-accent-green/20 stroke-accent-green'
                      : 'fill-transparent stroke-dark-light/25 dark:stroke-neutral/25'
                  }`}
                  strokeWidth="2.5"
                />
                <text
                  x="100" y="36"
                  textAnchor="middle"
                  className={`text-[11px] font-semibold select-none pointer-events-none transition-colors ${
                    hovered === 'HEAD'
                      ? 'fill-accent-green'
                      : 'fill-dark-light/40 dark:fill-neutral/40'
                  }`}
                >
                  Tête
                </text>
              </g>

              {/* LEFT FOOT — clickable (viewer's left = player's right, but label says "Pied gauche") */}
              <g
                onClick={() => onSelect('LEFT_FOOT')}
                onMouseEnter={() => setHovered('LEFT_FOOT')}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <ellipse
                  cx="60" cy="275" rx="28" ry="22"
                  className={`transition-all duration-150 ${
                    hovered === 'LEFT_FOOT'
                      ? 'fill-accent-green/20 stroke-accent-green'
                      : 'fill-transparent stroke-dark-light/25 dark:stroke-neutral/25'
                  }`}
                  strokeWidth="2.5"
                />
                <text
                  x="60" y="272"
                  textAnchor="middle"
                  className={`text-[9px] font-semibold select-none pointer-events-none transition-colors ${
                    hovered === 'LEFT_FOOT'
                      ? 'fill-accent-green'
                      : 'fill-dark-light/40 dark:fill-neutral/40'
                  }`}
                >
                  Pied
                </text>
                <text
                  x="60" y="284"
                  textAnchor="middle"
                  className={`text-[9px] font-semibold select-none pointer-events-none transition-colors ${
                    hovered === 'LEFT_FOOT'
                      ? 'fill-accent-green'
                      : 'fill-dark-light/40 dark:fill-neutral/40'
                  }`}
                >
                  gauche
                </text>
              </g>

              {/* RIGHT FOOT — clickable */}
              <g
                onClick={() => onSelect('RIGHT_FOOT')}
                onMouseEnter={() => setHovered('RIGHT_FOOT')}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <ellipse
                  cx="140" cy="275" rx="28" ry="22"
                  className={`transition-all duration-150 ${
                    hovered === 'RIGHT_FOOT'
                      ? 'fill-accent-green/20 stroke-accent-green'
                      : 'fill-transparent stroke-dark-light/25 dark:stroke-neutral/25'
                  }`}
                  strokeWidth="2.5"
                />
                <text
                  x="140" y="272"
                  textAnchor="middle"
                  className={`text-[9px] font-semibold select-none pointer-events-none transition-colors ${
                    hovered === 'RIGHT_FOOT'
                      ? 'fill-accent-green'
                      : 'fill-dark-light/40 dark:fill-neutral/40'
                  }`}
                >
                  Pied
                </text>
                <text
                  x="140" y="284"
                  textAnchor="middle"
                  className={`text-[9px] font-semibold select-none pointer-events-none transition-colors ${
                    hovered === 'RIGHT_FOOT'
                      ? 'fill-accent-green'
                      : 'fill-dark-light/40 dark:fill-neutral/40'
                  }`}
                >
                  droit
                </text>
              </g>
            </svg>
          </div>

          {/* Skip */}
          <button
            onClick={onSkip}
            className="w-full py-2 text-xs text-dark-light/40 dark:text-neutral/40 hover:text-dark-light dark:hover:text-neutral transition-colors"
          >
            Passer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Assist Picker ────────────────────────────────────────────────────── */

function AssistPickerOverlay({
  players,
  scorerPlayerId,
  onSelect,
  onSkip,
  onClose,
}: {
  players: MatchPlayerEntry[];
  scorerPlayerId: string;
  onSelect: (playerId: string) => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const filteredPlayers = players.filter(p => p.player_id !== scorerPlayerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-lightest dark:bg-dark-secondary rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-neutral/20 dark:border-dark-light">
          <div>
            <h3 className="text-base font-bold text-dark dark:text-white">Passe décisive ?</h3>
            <p className="text-xs text-dark-light/50 dark:text-neutral/50 mt-0.5">
              Quel joueur a fait la passe décisive ?
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral/10 dark:hover:bg-dark-light transition-colors">
            <X className="w-4 h-4 text-dark-light dark:text-neutral" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-2">
            {filteredPlayers.map(mp => (
              <button
                key={mp.player_id}
                onClick={() => onSelect(mp.player_id)}
                className="flex items-center gap-3 p-3 bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-xl hover:border-accent-blue/40 hover:shadow-sm transition-all text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue font-bold text-sm shrink-0">
                  {mp.player.jersey_number ?? '–'}
                </div>
                <p className="text-sm font-semibold text-dark dark:text-white truncate">
                  {mp.player.first_name} {mp.player.last_name}
                </p>
              </button>
            ))}
          </div>
        </div>
        <div className="p-5 border-t border-neutral/20 dark:border-dark-light">
          <button
            onClick={onSkip}
            className="w-full py-2.5 rounded-xl border border-neutral/20 dark:border-dark-light text-sm font-medium text-dark-light dark:text-neutral hover:bg-neutral/5 dark:hover:bg-dark-lighter transition-colors"
          >
            Pas de passe décisive
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

type EventFlowStep = 'idle' | 'pick-player' | 'pick-opponent-jersey' | 'pick-zone' | 'pick-body-part' | 'pick-assist';

export default function DirectPage() {
  // Team & match selection
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchDetail | null>(null);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayerEntry[]>([]);
  const [matchEvents, setMatchEvents] = useState<MatchEventEntry[]>([]);

  // Opponent events (local only)
  const [opponentEvents, setOpponentEvents] = useState<OpponentEvent[]>([]);

  // Chrono
  const [chronoSeconds, setChronoSeconds] = useState(0);
  const [isChronoRunning, setIsChronoRunning] = useState(false);
  const chronoInterval = useRef<NodeJS.Timeout | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isOpponentMode, setIsOpponentMode] = useState(false);

  // Event flow
  const [flowStep, setFlowStep] = useState<EventFlowStep>('idle');
  const [pendingEventType, setPendingEventType] = useState<MatchEventType | null>(null);
  const [pendingPlayerId, setPendingPlayerId] = useState<string | null>(null);
  const [pendingZone, setPendingZone] = useState<FieldZone | undefined>(undefined);
  const [pendingBodyPart, setPendingBodyPart] = useState<BodyPart | undefined>(undefined);
  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null);

  // ── Team restore ──────────────────────────────────────────────────────
  useEffect(() => {
    const id = localStorage.getItem('activeTeamId');
    const name = localStorage.getItem('activeTeamName');
    const cat = localStorage.getItem('activeTeamCategory');
    if (id && name) setActiveTeam({ id, name, category: cat || '', club_id: '' });
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent<Team>) => {
      setActiveTeam(e.detail);
      setSelectedMatch(null);
      setMatchEvents([]);
      setMatchPlayers([]);
      setOpponentEvents([]);
      resetChrono();
    };
    window.addEventListener('activeTeamChanged', handler as EventListener);
    return () => window.removeEventListener('activeTeamChanged', handler as EventListener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch matches when team changes ───────────────────────────────────
  const fetchMatches = useCallback(async (teamId: string) => {
    try {
      setIsLoading(true);
      const data = await matchService.getMatchesByTeam(teamId);
      setMatches(data);
    } catch {
      setError('Erreur lors du chargement des matchs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTeam?.id) fetchMatches(activeTeam.id);
  }, [activeTeam?.id, fetchMatches]);

  // ── Select a match ────────────────────────────────────────────────────
  const handleSelectMatch = async (match: Match) => {
    try {
      setIsLoading(true);
      setError(null);

      if (match.status === 'UPCOMING') {
        // Vérifier le nombre de titulaires avant de passer en LIVE
        const players = await matchService.getMatchPlayers(match.id);
        const startersCount = players.filter(p => p.status === 'STARTER').length;

        if (startersCount < 2) {
          setError(
            `Il faut au moins 2 titulaires pour lancer un match en direct (actuellement ${startersCount}). Configurez la composition d'abord.`,
          );
          setIsLoading(false);
          return;
        }

        await matchService.updateStatus(match.id, 'LIVE');
      }

      const detail = await matchService.getMatch(match.id);
      setSelectedMatch(detail);
      setMatchPlayers(detail.matchPlayers || []);
      setMatchEvents(detail.matchEvents || []);
      setOpponentEvents([]);

      setChronoSeconds(0);
      setIsChronoRunning(false);
      if (chronoInterval.current) clearInterval(chronoInterval.current);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du match');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Chrono logic ──────────────────────────────────────────────────────
  const startChrono = () => {
    if (chronoInterval.current) clearInterval(chronoInterval.current);
    setIsChronoRunning(true);
    chronoInterval.current = setInterval(() => {
      setChronoSeconds(prev => prev + 1);
    }, 1000);
  };

  const pauseChrono = () => {
    setIsChronoRunning(false);
    if (chronoInterval.current) {
      clearInterval(chronoInterval.current);
      chronoInterval.current = null;
    }
  };

  const resetChrono = () => {
    pauseChrono();
    setChronoSeconds(0);
  };

  useEffect(() => {
    return () => {
      if (chronoInterval.current) clearInterval(chronoInterval.current);
    };
  }, []);

  // ── Toast helper ──────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Event flow (our team) ─────────────────────────────────────────────
  const startEventFlow = (eventType: MatchEventType) => {
    setPendingEventType(eventType);
    setPendingPlayerId(null);
    setPendingZone(undefined);
    setPendingBodyPart(undefined);
    setPendingGoalId(null);

    if (isOpponentMode) {
      setFlowStep('pick-opponent-jersey');
    } else {
      setFlowStep('pick-player');
    }
  };

  const cancelFlow = () => {
    setFlowStep('idle');
    setPendingEventType(null);
    setPendingPlayerId(null);
    setPendingZone(undefined);
    setPendingBodyPart(undefined);
    setPendingGoalId(null);
  };

  const handlePlayerSelected = (playerId: string) => {
    setPendingPlayerId(playerId);
    setFlowStep('pick-zone');
  };

  const handleZoneSelected = (zone: FieldZone) => {
    setPendingZone(zone);
    if (pendingEventType === 'GOAL') {
      setFlowStep('pick-body-part');
    } else {
      submitEvent(pendingPlayerId!, pendingEventType!, zone, undefined);
    }
  };

  const handleZoneSkipped = () => {
    if (pendingEventType === 'GOAL') {
      setFlowStep('pick-body-part');
    } else {
      submitEvent(pendingPlayerId!, pendingEventType!, undefined, undefined);
    }
  };

  const handleBodyPartSelected = (part: BodyPart) => {
    setPendingBodyPart(part);
    submitEvent(pendingPlayerId!, pendingEventType!, pendingZone, part);
  };

  const handleBodyPartSkipped = () => {
    submitEvent(pendingPlayerId!, pendingEventType!, pendingZone, undefined);
  };

  const handleAssistPlayerSelected = async (playerId: string) => {
    if (!selectedMatch || !pendingGoalId) return;
    try {
      setIsSending(true);
      const minute = formatChronoMinute(chronoSeconds);
      await matchService.addEventToMatch(selectedMatch.id, {
        player_id: playerId,
        event_type: 'ASSIST',
        minute,
        related_event_id: pendingGoalId,
      });
      showToast('Passe décisive ajoutée');
      await refreshEvents();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'ajout de la passe');
    } finally {
      setIsSending(false);
      cancelFlow();
    }
  };

  // ── Opponent event flow ───────────────────────────────────────────────
  const handleOpponentJerseySubmit = (jersey: string) => {
    const minute = formatChronoMinute(chronoSeconds);
    const oppEvent: OpponentEvent = {
      id: generateLocalId(),
      event_type: pendingEventType as 'GOAL' | 'YELLOW_CARD' | 'RED_CARD',
      minute,
      jersey_number: jersey,
      isOpponent: true,
    };
    setOpponentEvents(prev => [...prev, oppEvent]);
    const cfg = EVENT_CONFIG[pendingEventType!];
    showToast(`${cfg.label} adverse${jersey ? ` — #${jersey}` : ''} (${minute}')`);
    cancelFlow();
  };

  const handleDeleteOpponentEvent = (id: string) => {
    setOpponentEvents(prev => prev.filter(e => e.id !== id));
    showToast('Événement adverse supprimé');
  };

  // ── Submit our team event ─────────────────────────────────────────────
  const submitEvent = async (
    playerId: string,
    eventType: MatchEventType,
    zone?: FieldZone,
    bodyPart?: BodyPart,
  ) => {
    if (!selectedMatch) return;
    try {
      setIsSending(true);
      setFlowStep('idle');

      const minute = formatChronoMinute(chronoSeconds);
      const payload: CreateMatchEventPayload = {
        player_id: playerId,
        event_type: eventType,
        minute,
        zone,
        body_part: bodyPart,
      };

      const result = await matchService.addEventToMatch(selectedMatch.id, payload);

      const player = matchPlayers.find(p => p.player_id === playerId)?.player;
      const playerName = player ? `${player.first_name} ${player.last_name}` : '';
      const cfg = EVENT_CONFIG[eventType];
      showToast(`${cfg.label} — ${playerName} (${minute}')`);

      if (eventType === 'GOAL' && result.event?.id) {
        setPendingGoalId(result.event.id);
        setFlowStep('pick-assist');
      } else {
        cancelFlow();
      }

      await refreshEvents();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'ajout');
      cancelFlow();
    } finally {
      setIsSending(false);
    }
  };

  const refreshEvents = async () => {
    if (!selectedMatch) return;
    try {
      const events = await matchService.getMatchEvents(selectedMatch.id);
      setMatchEvents(events);
    } catch {
      // silent
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!selectedMatch) return;
    try {
      await matchService.removeMatchEvent(selectedMatch.id, eventId);
      showToast('Événement supprimé');
      await refreshEvents();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // ── Finish match ──────────────────────────────────────────────────────
  const handleFinishMatch = async () => {
    if (!selectedMatch) return;
    const confirm = window.confirm('Terminer ce match ? Cette action est irréversible.');
    if (!confirm) return;
    try {
      await matchService.updateStatus(selectedMatch.id, 'FINISHED');
      pauseChrono();
      showToast('Match terminé');
      setSelectedMatch(null);
      if (activeTeam?.id) fetchMatches(activeTeam.id);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de la terminaison');
    }
  };

  // ── Back to selector ──────────────────────────────────────────────────
  const handleBack = () => {
    pauseChrono();
    setSelectedMatch(null);
    setMatchEvents([]);
    setMatchPlayers([]);
    setOpponentEvents([]);
    setChronoSeconds(0);
    if (activeTeam?.id) fetchMatches(activeTeam.id);
  };

  // ── Computed ──────────────────────────────────────────────────────────
  const ourGoalCount = useMemo(
    () => matchEvents.filter(e => e.event_type === 'GOAL').length,
    [matchEvents]
  );
  const oppGoalCount = useMemo(
    () => opponentEvents.filter(e => e.event_type === 'GOAL').length,
    [opponentEvents]
  );

  // Merged timeline: combine team events + opponent events, sorted by minute desc
  const timeline: TimelineItem[] = useMemo(() => {
    const teamItems: TimelineItem[] = matchEvents.map(e => ({ ...e, isOpponent: false as const }));
    const oppItems: TimelineItem[] = opponentEvents;
    return [...teamItems, ...oppItems].sort((a, b) => b.minute - a.minute);
  }, [matchEvents, opponentEvents]);

  // ── No team ───────────────────────────────────────────────────────────
  if (!activeTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Radio className="w-12 h-12 text-neutral mb-4" />
        <p className="text-dark-light dark:text-neutral font-medium">Aucune équipe sélectionnée</p>
        <p className="text-sm text-dark-light/50 dark:text-neutral/50 mt-1">
          Sélectionnez une équipe dans la barre de navigation
        </p>
      </div>
    );
  }

  if (isLoading && !selectedMatch) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-neutral/20 dark:bg-dark-light rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !selectedMatch) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-accent-red font-medium">{error}</p>
        <button onClick={() => fetchMatches(activeTeam.id)} className="mt-3 text-sm text-accent-green hover:underline">
          Réessayer
        </button>
      </div>
    );
  }

  // ── Match selector ────────────────────────────────────────────────────
  if (!selectedMatch) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark dark:text-white leading-tight">Direct</h1>
          {activeTeam && (
            <p className="text-sm text-dark-light/70 dark:text-neutral mt-1">
              {activeTeam.name}
              {activeTeam.category && (
                <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green">
                  {activeTeam.category}
                </span>
              )}
            </p>
          )}
        </div>
        <MatchSelector matches={matches} teamName={activeTeam.name} onSelect={handleSelectMatch} />
      </div>
    );
  }

  // ── Live interface ────────────────────────────────────────────────────
  const activeQuickEvents = isOpponentMode ? OPPONENT_EVENTS : QUICK_EVENTS;

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl border border-neutral/20 dark:border-dark-light text-dark-light dark:text-neutral hover:bg-neutral/5 dark:hover:bg-dark-lighter transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <LivePulse />
            <h1 className="text-lg md:text-xl font-bold text-dark dark:text-white">Direct</h1>
          </div>
          <p className="text-xs text-dark-light/50 dark:text-neutral/50 mt-0.5">
            {selectedMatch.team?.name} vs {selectedMatch.opponent}
            {' · '}
            {selectedMatch.location === 'HOME' ? 'Domicile' : 'Extérieur'}
          </p>
        </div>
        <button
          onClick={handleFinishMatch}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20 transition-colors"
        >
          <Square className="w-3.5 h-3.5" />
          Terminer
        </button>
      </div>

      {/* ── Scoreboard + Chrono ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-2xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-accent-green via-accent-green/60 to-transparent" />
        <div className="p-5">
          {/* Score */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4">
            <div className="text-center flex-1">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-accent-green/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent-green" />
              </div>
              <p className="text-sm font-bold text-dark dark:text-white truncate">
                {selectedMatch.team?.name}
              </p>
            </div>

            {/* Score display */}
            <div className="text-center">
              <div className="flex items-center gap-3">
                <span className="text-4xl md:text-5xl font-black text-dark dark:text-white">{ourGoalCount}</span>
                <span className="text-2xl md:text-3xl font-bold text-dark-light/25 dark:text-neutral/25">–</span>
                <span className="text-4xl md:text-5xl font-black text-dark dark:text-white">{oppGoalCount}</span>
              </div>
            </div>

            <div className="text-center flex-1">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-accent-red/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent-red" />
              </div>
              <p className="text-sm font-bold text-dark dark:text-white truncate">
                {selectedMatch.opponent}
              </p>
            </div>
          </div>

          {/* Chrono */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 bg-neutral-lighter/60 dark:bg-dark-secondary/60 rounded-xl px-5 py-2.5">
              <Timer className="w-4 h-4 text-dark-light/60 dark:text-neutral/50" />
              <span className="text-2xl md:text-3xl font-mono font-bold text-dark dark:text-white tracking-wider">
                {formatChrono(chronoSeconds)}
              </span>
            </div>
          </div>

          {/* Chrono controls */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {!isChronoRunning ? (
              <button
                onClick={startChrono}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-accent-green text-white hover:bg-accent-green/90 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                {chronoSeconds === 0 ? 'Démarrer' : 'Reprendre'}
              </button>
            ) : (
              <button
                onClick={pauseChrono}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-dark-light/10 dark:bg-dark-secondary text-dark dark:text-white hover:bg-dark-light/20 dark:hover:bg-dark-secondary/80 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause
              </button>
            )}
            <button
              onClick={resetChrono}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-neutral/20 dark:border-dark-light text-dark-light dark:text-neutral hover:bg-neutral/5 dark:hover:bg-dark-secondary/30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick actions ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-2xl p-5">
        {/* Team / Opponent toggle — full-width, prominent */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-dark-light/60 dark:text-neutral/60 uppercase tracking-wide mb-2">
            Actions rapides
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsOpponentMode(false)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                !isOpponentMode
                  ? 'bg-accent-green/10 border-accent-green text-accent-green shadow-sm'
                  : 'bg-neutral-lighter/40 dark:bg-dark-secondary/40 border-transparent text-dark-light/50 dark:text-neutral/50 hover:border-neutral/30 dark:hover:border-dark-light/30'
              }`}
            >
              <Shield className="w-4 h-4" />
              Notre équipe
            </button>
            <button
              onClick={() => setIsOpponentMode(true)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                isOpponentMode
                  ? 'bg-accent-red/10 border-accent-red text-accent-red shadow-sm'
                  : 'bg-neutral-lighter/40 dark:bg-dark-secondary/40 border-transparent text-dark-light/50 dark:text-neutral/50 hover:border-neutral/30 dark:hover:border-dark-light/30'
              }`}
            >
              <Shield className="w-4 h-4" />
              Adversaire
            </button>
          </div>
        </div>

        <div className={`grid gap-2 ${isOpponentMode ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-5'}`}>
          {activeQuickEvents.map(type => {
            const cfg = EVENT_CONFIG[type];
            return (
              <button
                key={type}
                onClick={() => startEventFlow(type)}
                disabled={isSending}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:shadow-sm disabled:opacity-50 ${
                  isOpponentMode
                    ? 'bg-accent-red/5 border-accent-red/20 text-accent-red hover:bg-accent-red/10'
                    : `${cfg.bg} ${cfg.border} ${cfg.color}`
                } hover:scale-[1.02] active:scale-[0.98]`}
              >
                {cfg.icon}
                <span className="text-xs font-semibold">{cfg.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold text-dark-light/60 dark:text-neutral/60 uppercase tracking-wide">
            Chronologie
          </p>
          <span className="text-xs text-dark-light/40 dark:text-neutral/40">
            {timeline.length} événement{timeline.length !== 1 ? 's' : ''}
          </span>
        </div>

        {timeline.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="w-8 h-8 text-neutral/40 mx-auto mb-2" />
            <p className="text-sm text-dark-light/40 dark:text-neutral/40">
              Aucun événement pour le moment
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {timeline.map(item => {
              const isOpp = 'isOpponent' in item && item.isOpponent;
              const cfg = EVENT_CONFIG[item.event_type as MatchEventType] || EVENT_CONFIG.RECOVERY;

              if (isOpp) {
                const oppItem = item as OpponentEvent;
                return (
                  <div
                    key={oppItem.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-accent-red/5 dark:bg-accent-red/5 border border-accent-red/10 group"
                  >
                    <div className="w-10 text-center shrink-0">
                      <span className="text-sm font-bold text-dark dark:text-white">{oppItem.minute}&apos;</span>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <span className={cfg.color}>{cfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark dark:text-white truncate">
                        <span className="text-accent-red/70 text-xs font-medium mr-1.5">ADV</span>
                        {oppItem.jersey_number ? `Joueur #${oppItem.jersey_number}` : 'Joueur inconnu'}
                      </p>
                      <span className={`text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteOpponentEvent(oppItem.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-dark-light/30 dark:text-neutral/30 hover:text-accent-red hover:bg-accent-red/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              // Our team event
              const teamItem = item as MatchEventEntry;
              return (
                <div
                  key={teamItem.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-lighter/40 dark:bg-dark-secondary/30 group"
                >
                  <div className="w-10 text-center shrink-0">
                    <span className="text-sm font-bold text-dark dark:text-white">{teamItem.minute}&apos;</span>
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <span className={cfg.color}>{cfg.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark dark:text-white truncate">
                      {teamItem.player.first_name} {teamItem.player.last_name}
                      {teamItem.player.jersey_number != null && (
                        <span className="text-dark-light/40 dark:text-neutral/40 ml-1 font-normal">
                          #{teamItem.player.jersey_number}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>
                      {teamItem.zone && (
                        <span className="text-[10px] text-dark-light/40 dark:text-neutral/40">
                          · {ZONE_CONFIG.find(z => z.key === teamItem.zone)?.label || teamItem.zone}
                        </span>
                      )}
                      {teamItem.body_part && (
                        <span className="text-[10px] text-dark-light/40 dark:text-neutral/40">
                          · {BODY_PART_CONFIG.find(b => b.key === teamItem.body_part)?.label || teamItem.body_part}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(teamItem.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-dark-light/30 dark:text-neutral/30 hover:text-accent-red hover:bg-accent-red/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Overlays ───────────────────────────────────────────────────── */}
      {flowStep === 'pick-player' && (
        <PlayerPickerOverlay
          players={matchPlayers}
          onSelect={handlePlayerSelected}
          onClose={cancelFlow}
        />
      )}

      {flowStep === 'pick-opponent-jersey' && pendingEventType && (
        <OpponentJerseyOverlay
          eventType={pendingEventType as 'GOAL' | 'YELLOW_CARD' | 'RED_CARD'}
          onSubmit={handleOpponentJerseySubmit}
          onClose={cancelFlow}
        />
      )}

      {flowStep === 'pick-zone' && (
        <ZonePickerOverlay
          onSelect={handleZoneSelected}
          onSkip={handleZoneSkipped}
          onClose={cancelFlow}
        />
      )}

      {flowStep === 'pick-body-part' && (
        <BodyPartPickerOverlay
          onSelect={handleBodyPartSelected}
          onSkip={handleBodyPartSkipped}
          onClose={cancelFlow}
        />
      )}

      {flowStep === 'pick-assist' && (
        <AssistPickerOverlay
          players={matchPlayers}
          scorerPlayerId={pendingPlayerId!}
          onSelect={handleAssistPlayerSelected}
          onSkip={cancelFlow}
          onClose={cancelFlow}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-dark dark:bg-white text-white dark:text-dark rounded-xl shadow-lg text-sm font-medium">
            <Check className="w-4 h-4 text-accent-green" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
