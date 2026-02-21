'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Calendar, MapPin, Clock, Users, Play, ChevronRight,
  Shield, Radio, Trophy, Search, Filter,
} from 'lucide-react';
import { matchService, Match, MatchStatus } from '@/services/matchService';
import { Team } from '@/services/teamService';
import CreateMatchModal from '../parts/CreateMatchModal';
import CompositionModal from '../parts/CompositionModal';
import MatchSummaryModal from '../parts/MatchSummaryModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MatchStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  UPCOMING: {
    label: 'À venir',
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
    icon: <Calendar className="w-3.5 h-3.5" />,
  },
  LIVE: {
    label: 'En cours',
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
    icon: <Radio className="w-3.5 h-3.5" />,
  },
  FINISHED: {
    label: 'Terminé',
    color: 'text-dark-light dark:text-neutral',
    bg: 'bg-neutral/10 dark:bg-dark-light',
    icon: <Trophy className="w-3.5 h-3.5" />,
  },
};

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: 'Tous' },
  { key: 'UPCOMING', label: 'À venir' },
  { key: 'LIVE', label: 'En direct' },
  { key: 'FINISHED', label: 'Terminés' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function relativeDate(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  if (days === -1) return 'Hier';
  if (days > 1 && days <= 7) return `Dans ${days} jours`;
  if (days < -1 && days >= -7) return `Il y a ${Math.abs(days)} jours`;
  return formatDate(iso);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LivePulse() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-green" />
    </span>
  );
}

function MatchCard({
  match,
  teamName,
  onComposition,
  onGoLive,
  onSummary,
}: {
  match: Match;
  teamName: string;
  onComposition: () => void;
  onGoLive: () => void;
  onSummary: () => void;
}) {
  const cfg = STATUS_CONFIG[match.status];
  const isLive = match.status === 'LIVE';
  const isUpcoming = match.status === 'UPCOMING';

  return (
    <div
      className={`group bg-white dark:bg-dark-lighter border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md ${
        isLive
          ? 'border-accent-green/40 shadow-accent-green/5 shadow-lg'
          : 'border-neutral/20 dark:border-dark-light hover:border-accent-green/30'
      }`}
    >
      {/* Top accent bar */}
      {isLive && (
        <div className="h-0.5 bg-gradient-to-r from-accent-green via-accent-green/60 to-transparent" />
      )}

      <div className="p-5">
        {/* Header row: status + date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isLive && <LivePulse />}
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
          <span className="text-xs text-dark-light/50 dark:text-neutral/50">
            {relativeDate(match.match_date)}
          </span>
        </div>

        {/* Matchup */}
        <div className="flex items-center gap-4 mb-4">
          {/* Our team */}
          <div className="flex-1 text-center">
            <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-accent-green/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-green" />
            </div>
            <p className="text-sm font-bold text-dark dark:text-white truncate">{teamName}</p>
            {match.location === 'HOME' && (
              <span className="text-[10px] text-dark-light/40 dark:text-neutral/40">Domicile</span>
            )}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-black text-dark-light/30 dark:text-neutral/30">VS</span>
          </div>

          {/* Opponent */}
          <div className="flex-1 text-center">
            <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-accent-red/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-red" />
            </div>
            <p className="text-sm font-bold text-dark dark:text-white truncate">{match.opponent}</p>
            {match.location === 'AWAY' && (
              <span className="text-[10px] text-dark-light/40 dark:text-neutral/40">Extérieur</span>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-center gap-4 text-xs text-dark-light/60 dark:text-neutral/50 mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(match.match_date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(match.match_date)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {match.location === 'HOME' ? 'Dom.' : 'Ext.'}
          </span>
        </div>

        {/* Stats bar */}
        {match._count && (
          <div className="flex items-center justify-center gap-4 text-xs text-dark-light/50 dark:text-neutral/40 pb-3 border-b border-neutral/10 dark:border-dark-light mb-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {match._count.matchPlayers} convoqué{match._count.matchPlayers !== 1 ? 's' : ''}
            </span>
            {match.status === 'FINISHED' && (
              <span className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                {match._count.matchEvents} événement{match._count.matchEvents !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onComposition}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-neutral/20 dark:border-dark-light text-dark-light dark:text-neutral hover:bg-neutral/5 dark:hover:bg-dark-secondary/30 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            Composition
          </button>

          {isUpcoming && (
            <button
              onClick={onGoLive}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-accent-green text-white hover:bg-accent-green/90 transition-colors group/btn"
            >
              <Play className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              Lancer en direct
            </button>
          )}

          {isLive && (
            <button
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors"
            >
              <Radio className="w-3.5 h-3.5" />
              Ouvrir le direct
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          {match.status === 'FINISHED' && (
            <button
              onClick={onSummary}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              Voir le résumé
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function MatchsPage() {
  const [activeTeam, setActiveTeam]         = useState<Team | null>(null);
  const [matches, setMatches]               = useState<Match[]>([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [statusFilter, setStatusFilter]     = useState('');
  const [searchQuery, setSearchQuery]       = useState('');
  const [isCreateOpen, setIsCreateOpen]     = useState(false);
  const [compositionMatchId, setCompositionMatchId] = useState<string | null>(null);
  const [summaryMatchId, setSummaryMatchId]         = useState<string | null>(null);

  // ── Restore team from localStorage ────────────────────────────────────
  useEffect(() => {
    const id   = localStorage.getItem('activeTeamId');
    const name = localStorage.getItem('activeTeamName');
    const cat  = localStorage.getItem('activeTeamCategory');
    if (id && name) setActiveTeam({ id, name, category: cat || '', club_id: '' });
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent<Team>) => {
      setActiveTeam(e.detail);
      localStorage.setItem('activeTeamName', e.detail.name);
      localStorage.setItem('activeTeamCategory', e.detail.category);
    };
    window.addEventListener('activeTeamChanged', handler as EventListener);
    return () => window.removeEventListener('activeTeamChanged', handler as EventListener);
  }, []);

  // ── Fetch matches ─────────────────────────────────────────────────────
  const fetchMatches = useCallback(async (teamId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await matchService.getMatchesByTeam(teamId);
      setMatches(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des matchs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTeam?.id) fetchMatches(activeTeam.id);
  }, [activeTeam?.id, fetchMatches]);

  // ── Go live ───────────────────────────────────────────────────────────
  const handleGoLive = async (matchId: string) => {
    try {
      // Vérifier qu'il y a au moins 2 titulaires avant de passer en direct
      const players = await matchService.getMatchPlayers(matchId);
      const startersCount = players.filter(p => p.status === 'STARTER').length;

      if (startersCount < 2) {
        alert(
          `Il faut au moins 2 titulaires pour lancer un match en direct (actuellement ${startersCount}). Configurez la composition d'abord.`,
        );
        return;
      }

      await matchService.updateStatus(matchId, 'LIVE');
      if (activeTeam?.id) fetchMatches(activeTeam.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors du passage en direct');
    }
  };

  // ── Filtered & grouped matches ────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = matches;
    if (statusFilter) list = list.filter(m => m.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => m.opponent.toLowerCase().includes(q));
    }
    return list;
  }, [matches, statusFilter, searchQuery]);

  // Group: LIVE first, then UPCOMING sorted asc, then FINISHED sorted desc
  const grouped = useMemo(() => {
    const live = filtered.filter(m => m.status === 'LIVE');
    const upcoming = filtered
      .filter(m => m.status === 'UPCOMING')
      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
    const finished = filtered
      .filter(m => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());
    return { live, upcoming, finished };
  }, [filtered]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    if (activeTeam?.id) fetchMatches(activeTeam.id);
  };

  const handleCompositionSuccess = () => {
    setCompositionMatchId(null);
    if (activeTeam?.id) fetchMatches(activeTeam.id);
  };

  // ── Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: matches.length,
    upcoming: matches.filter(m => m.status === 'UPCOMING').length,
    live: matches.filter(m => m.status === 'LIVE').length,
    finished: matches.filter(m => m.status === 'FINISHED').length,
  }), [matches]);

  // ── No team ───────────────────────────────────────────────────────────
  if (!activeTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Calendar className="w-12 h-12 text-neutral mb-4" />
        <p className="text-dark-light dark:text-neutral font-medium">Aucune équipe sélectionnée</p>
        <p className="text-sm text-dark-light/50 dark:text-neutral/50 mt-1">
          Sélectionnez une équipe dans la barre de navigation
        </p>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-neutral/20 dark:bg-dark-light rounded-lg animate-pulse" />
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 w-28 bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-accent-red font-medium">{error}</p>
        <button onClick={() => fetchMatches(activeTeam.id)} className="mt-3 text-sm text-accent-green hover:underline">
          Réessayer
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark dark:text-white leading-tight">
            Matchs
          </h1>
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
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-green text-white rounded-xl text-sm font-medium hover:bg-accent-green/90 transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nouveau match
        </button>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-xl px-5 py-4 min-w-[100px]">
          <p className="text-2xl font-bold text-dark dark:text-white">{stats.total}</p>
          <p className="text-xs text-dark-light/60 dark:text-neutral">Total</p>
        </div>
        <div className="bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-xl px-5 py-4 min-w-[100px]">
          <p className="text-2xl font-bold text-accent-blue">{stats.upcoming}</p>
          <p className="text-xs text-dark-light/60 dark:text-neutral">À venir</p>
        </div>
        {stats.live > 0 && (
          <div className="bg-accent-green/5 border border-accent-green/30 rounded-xl px-5 py-4 min-w-[100px]">
            <div className="flex items-center gap-2">
              <LivePulse />
              <p className="text-2xl font-bold text-accent-green">{stats.live}</p>
            </div>
            <p className="text-xs text-accent-green/70">En direct</p>
          </div>
        )}
        <div className="bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-xl px-5 py-4 min-w-[100px]">
          <p className="text-2xl font-bold text-dark-light dark:text-neutral">{stats.finished}</p>
          <p className="text-xs text-dark-light/60 dark:text-neutral">Terminés</p>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-2xl p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-light/40 dark:text-neutral/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un adversaire..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-neutral-lighter/60 dark:bg-dark-secondary/40 border border-neutral/20 dark:border-dark-light text-dark dark:text-white placeholder:text-dark-light/40 dark:placeholder:text-neutral/40 rounded-xl text-sm outline-none focus:border-accent-green transition-colors"
          />
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-accent-green text-white'
                  : 'bg-neutral/10 dark:bg-dark-light text-dark-light dark:text-neutral hover:bg-neutral/20 dark:hover:bg-dark-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Match list ───────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="w-10 h-10 text-neutral mb-3" />
          <p className="text-dark-light dark:text-neutral font-medium">Aucun match</p>
          <p className="text-sm text-dark-light/50 dark:text-neutral/50 mt-1 mb-4">
            {statusFilter || searchQuery
              ? 'Aucun match ne correspond aux filtres'
              : 'Planifiez votre premier match'}
          </p>
          {!statusFilter && !searchQuery && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-xl text-sm font-medium hover:bg-accent-green/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau match
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live section */}
          {grouped.live.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <LivePulse />
                <h2 className="text-sm font-semibold text-accent-green uppercase tracking-wide">
                  En direct ({grouped.live.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped.live.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    teamName={activeTeam.name}
                    onComposition={() => setCompositionMatchId(m.id)}
                    onGoLive={() => {}}
                    onSummary={() => setSummaryMatchId(m.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming section */}
          {grouped.upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-dark-light/60 dark:text-neutral/60 uppercase tracking-wide mb-3">
                À venir ({grouped.upcoming.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped.upcoming.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    teamName={activeTeam.name}
                    onComposition={() => setCompositionMatchId(m.id)}
                    onGoLive={() => handleGoLive(m.id)}
                    onSummary={() => setSummaryMatchId(m.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Finished section */}
          {grouped.finished.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-dark-light/60 dark:text-neutral/60 uppercase tracking-wide mb-3">
                Terminés ({grouped.finished.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped.finished.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    teamName={activeTeam.name}
                    onComposition={() => setCompositionMatchId(m.id)}
                    onGoLive={() => {}}
                    onSummary={() => setSummaryMatchId(m.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      <CreateMatchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
        teamId={activeTeam.id}
      />

      {compositionMatchId && (
        <CompositionModal
          isOpen={!!compositionMatchId}
          onClose={() => setCompositionMatchId(null)}
          onSuccess={handleCompositionSuccess}
          matchId={compositionMatchId}
          teamId={activeTeam.id}
        />
      )}

      {summaryMatchId && (
        <MatchSummaryModal
          isOpen={!!summaryMatchId}
          onClose={() => setSummaryMatchId(null)}
          matchId={summaryMatchId}
          teamName={activeTeam.name}
        />
      )}
    </div>
  );
}
