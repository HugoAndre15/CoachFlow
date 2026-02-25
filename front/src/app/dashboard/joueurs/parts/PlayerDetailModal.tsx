'use client';

import { X, User, Target, Handshake, ShieldAlert, ShieldX, RotateCcw, TrendingDown, Trophy, Star } from 'lucide-react';
import { Player, PlayerStats } from '@/services/playerService';
import GoalZonesPitch from './GoalZonesPitch';

interface PlayerDetailModalProps {
  isOpen: boolean;
  player: Player | null;
  stats: PlayerStats | undefined;
  onClose: () => void;
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

const POSITION_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  GOALKEEPER: { label: 'Gardien',   bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-400/30' },
  DEFENDER:   { label: 'Défenseur', bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-400/30' },
  MIDFIELDER: { label: 'Milieu',    bg: 'bg-accent-green/15', text: 'text-accent-green', border: 'border-accent-green/30' },
  FORWARD:    { label: 'Attaquant', bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-400/30' },
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    'bg-accent-green/10 text-accent-green border-accent-green/30',
  INJURED:   'bg-red-500/10 text-red-400 border-red-500/30',
  SUSPENDED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  RETIRED:   'bg-neutral/10 text-dark-light dark:text-neutral border-neutral/30',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actif', INJURED: 'Blessé', SUSPENDED: 'Suspendu', RETIRED: 'Retraité',
};

const FOOT_LABEL: Record<string, string> = {
  RIGHT: 'Pied droit', LEFT: 'Pied gauche', BOTH: 'Les deux pieds',
};

const BODY_LABEL: Record<string, string> = {
  LEFT_FOOT:  'Pied gauche',
  RIGHT_FOOT: 'Pied droit',
  HEAD:       'Tête',
  CHEST:      'Poitrine',
  KNEE:       'Genou',
};

function toReadable(key: string): string {
  return key.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}

function StatItem({ icon, label, value, accent }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-lighter/60 dark:bg-dark/50 border border-neutral/10 dark:border-dark-light/20">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-neutral leading-tight">{label}</p>
        <p className="text-base font-bold text-dark dark:text-white leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-bold text-neutral/70 uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-neutral/10 dark:bg-dark-light/20" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlayerDetailModal({ isOpen, player, stats, onClose }: PlayerDetailModalProps) {
  if (!isOpen || !player) return null;

  const pos = player.position ? POSITION_LABELS[player.position] : null;
  const hasGoals = (stats?.goals ?? 0) > 0;

  // Body part stats filtered to non-zero only
  const bodyPartEntries = stats?.goals_by_body_part
    ? Object.entries(stats.goals_by_body_part).filter(([, v]) => v > 0)
    : [];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* ── Mobile: bottom sheet ─────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col md:hidden
        bg-white dark:bg-dark-lighter
        rounded-t-3xl shadow-2xl
        max-h-[92dvh]"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-neutral/25 dark:bg-dark-light/40" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral hover:text-dark dark:hover:text-white hover:bg-dark-light/10 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Header ── */}
        <div className="px-5 pt-2 pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Avatar + jersey */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 dark:bg-accent-blue/15 flex items-center justify-center">
                <User className="w-8 h-8 text-accent-blue" />
              </div>
              {player.jersey_number != null && (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-dark dark:bg-dark-secondary border-2 border-white dark:border-dark-lighter flex items-center justify-center">
                  <span className="text-[9px] font-black text-white leading-none">{player.jersey_number}</span>
                </div>
              )}
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-dark dark:text-white leading-tight truncate">
                {player.last_name}
              </h2>
              <p className="text-sm text-dark-light/60 dark:text-neutral leading-tight">
                {player.first_name}
              </p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {pos && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pos.bg} ${pos.text} ${pos.border}`}>
                    {pos.label}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[player.status] ?? STATUS_STYLE.ACTIVE}`}>
                  {STATUS_LABEL[player.status] ?? player.status}
                </span>
                {player.strong_foot && (
                  <span className="text-[10px] text-neutral/70 bg-neutral/10 dark:bg-dark-light/20 px-2 py-0.5 rounded-full">
                    {FOOT_LABEL[player.strong_foot]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats bar */}
          {stats && (
            <div className="mt-4 grid grid-cols-4 gap-1 bg-neutral-lighter/50 dark:bg-dark/40 rounded-2xl p-3">
              {[
                { value: stats.goals ?? 0, label: 'Buts', color: 'text-yellow-400' },
                { value: stats.assists ?? 0, label: 'Passes D.', color: 'text-accent-blue' },
                { value: stats.recoveries ?? 0, label: 'Récup.', color: 'text-accent-green' },
                { value: stats.total_matches ?? 0, label: 'Matchs', color: 'text-dark dark:text-white' },
              ].map(({ value, label, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-[9px] text-neutral/60 mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto pb-safe">
          <div className="px-5 pb-8 space-y-5">
            {!stats ? (
              <p className="text-center text-sm text-neutral py-8">Aucune statistique disponible</p>
            ) : (
              <>
                {/* Participations */}
                <div>
                  <SectionTitle>Participations</SectionTitle>
                  <div className="grid grid-cols-3 gap-2">
                    <StatItem icon={<Trophy className="w-4 h-4" />} label="Joués"     value={stats.total_matches ?? 0}       accent="bg-accent-blue/10 text-accent-blue" />
                    <StatItem icon={<Star className="w-4 h-4" />}   label="Titulaire" value={stats.matches_as_starter ?? 0}   accent="bg-accent-green/10 text-accent-green" />
                    <StatItem icon={<Star className="w-4 h-4" />}   label="Rempl."    value={stats.matches_as_substitute ?? 0} accent="bg-yellow-500/10 text-yellow-400" />
                  </div>
                </div>

                {/* Offensif */}
                <div>
                  <SectionTitle>Offensif</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <StatItem icon={<Target className="w-4 h-4" />}   label="Buts"             value={stats.goals ?? 0}   accent="bg-yellow-400/10 text-yellow-400" />
                    <StatItem icon={<Handshake className="w-4 h-4" />} label="Passes décisives" value={stats.assists ?? 0} accent="bg-accent-blue/10 text-accent-blue" />
                  </div>
                </div>

                {/* Défensif */}
                <div>
                  <SectionTitle>Défensif</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <StatItem icon={<RotateCcw className="w-4 h-4" />}   label="Récupérations"  value={stats.recoveries ?? 0}  accent="bg-accent-green/10 text-accent-green" />
                    <StatItem icon={<TrendingDown className="w-4 h-4" />} label="Pertes de balle" value={stats.ball_losses ?? 0} accent="bg-red-500/10 text-red-400" />
                  </div>
                </div>

                {/* Discipline */}
                <div>
                  <SectionTitle>Discipline</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <StatItem icon={<ShieldAlert className="w-4 h-4" />} label="Cartons jaunes" value={stats.yellow_cards ?? 0} accent="bg-yellow-500/10 text-yellow-400" />
                    <StatItem icon={<ShieldX className="w-4 h-4" />}     label="Cartons rouges" value={stats.red_cards ?? 0}    accent="bg-red-500/10 text-red-400" />
                  </div>
                </div>

                {/* Terrain */}
                {hasGoals && stats.goals_by_zone && (
                  <div>
                    <SectionTitle>Buts par zone</SectionTitle>
                    <GoalZonesPitch goalsByZone={stats.goals_by_zone} />
                  </div>
                )}

                {/* Partie du corps */}
                {hasGoals && bodyPartEntries.length > 0 && (
                  <div>
                    <SectionTitle>Buts par partie du corps</SectionTitle>
                    <div className="grid grid-cols-3 gap-2">
                      {bodyPartEntries.map(([part, count]) => (
                        <div key={part} className="flex flex-col items-center p-3 rounded-2xl bg-neutral-lighter/60 dark:bg-dark/50 border border-neutral/10 dark:border-dark-light/20">
                          <span className="text-2xl font-black text-dark dark:text-white">{count}</span>
                          <span className="text-[10px] text-neutral text-center mt-1 leading-tight">{BODY_LABEL[part] ?? toReadable(part)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop: centered modal ──────────────────────────── */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[88vh]">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-dark-light/10 dark:border-dark-light/20 flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral hover:text-dark dark:hover:text-white hover:bg-dark-light/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 dark:bg-accent-blue/20 flex items-center justify-center">
                  <User className="w-7 h-7 text-accent-blue" />
                </div>
                {player.jersey_number != null && (
                  <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-dark dark:bg-dark-secondary border-2 border-white dark:border-dark-lighter flex items-center justify-center">
                    <span className="text-[8px] font-black text-white leading-none">{player.jersey_number}</span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark dark:text-white leading-tight">
                  {player.first_name} {player.last_name}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {pos && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${pos.bg} ${pos.text} ${pos.border}`}>
                      {pos.label}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[player.status] ?? STATUS_STYLE.ACTIVE}`}>
                    {STATUS_LABEL[player.status] ?? player.status}
                  </span>
                  {player.strong_foot && (
                    <span className="text-xs text-neutral">{FOOT_LABEL[player.strong_foot]}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable stats */}
          <div className="flex-1 overflow-y-auto p-6">
            {!stats ? (
              <p className="text-center text-sm text-neutral py-6">Aucune statistique disponible</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <SectionTitle>Participations</SectionTitle>
                  <div className="grid grid-cols-3 gap-2">
                    <StatItem icon={<Trophy className="w-4 h-4" />} label="Matchs joués" value={stats.total_matches ?? 0}       accent="bg-accent-blue/10 text-accent-blue" />
                    <StatItem icon={<Star className="w-4 h-4" />}   label="Titulaire"    value={stats.matches_as_starter ?? 0}   accent="bg-accent-green/10 text-accent-green" />
                    <StatItem icon={<Star className="w-4 h-4" />}   label="Remplaçant"   value={stats.matches_as_substitute ?? 0} accent="bg-yellow-500/10 text-yellow-400" />
                  </div>
                </div>

                <div>
                  <SectionTitle>Offensif</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <StatItem icon={<Target className="w-4 h-4" />}   label="Buts"             value={stats.goals ?? 0}   accent="bg-yellow-400/10 text-yellow-400" />
                    <StatItem icon={<Handshake className="w-4 h-4" />} label="Passes décisives" value={stats.assists ?? 0} accent="bg-accent-blue/10 text-accent-blue" />
                  </div>
                </div>

                <div>
                  <SectionTitle>Défensif</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <StatItem icon={<RotateCcw className="w-4 h-4" />}   label="Récupérations"   value={stats.recoveries ?? 0}  accent="bg-accent-green/10 text-accent-green" />
                    <StatItem icon={<TrendingDown className="w-4 h-4" />} label="Pertes de balle" value={stats.ball_losses ?? 0} accent="bg-red-500/10 text-red-400" />
                  </div>
                </div>

                <div>
                  <SectionTitle>Discipline</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <StatItem icon={<ShieldAlert className="w-4 h-4" />} label="Cartons jaunes" value={stats.yellow_cards ?? 0} accent="bg-yellow-500/10 text-yellow-400" />
                    <StatItem icon={<ShieldX className="w-4 h-4" />}     label="Cartons rouges" value={stats.red_cards ?? 0}    accent="bg-red-500/10 text-red-400" />
                  </div>
                </div>

                {hasGoals && stats.goals_by_zone && (
                  <GoalZonesPitch goalsByZone={stats.goals_by_zone} />
                )}

                {hasGoals && bodyPartEntries.length > 0 && (
                  <div>
                    <SectionTitle>Buts par partie du corps</SectionTitle>
                    <div className="grid grid-cols-3 gap-2">
                      {bodyPartEntries.map(([part, count]) => (
                        <div key={part} className="flex flex-col items-center p-3 rounded-xl bg-dark/30 dark:bg-dark/50 border border-dark-light/10">
                          <span className="text-lg font-bold text-dark dark:text-white">{count}</span>
                          <span className="text-xs text-neutral text-center mt-0.5">{BODY_LABEL[part] ?? toReadable(part)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 pt-0 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full py-2.5 border border-dark-light/20 dark:border-dark-light rounded-xl text-sm font-medium text-dark-light dark:text-neutral hover:bg-dark-light/5 dark:hover:bg-dark-light/10 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

