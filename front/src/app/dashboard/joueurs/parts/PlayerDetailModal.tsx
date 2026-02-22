'use client';

import { X, User, Target, Handshake, ShieldAlert, ShieldX, RotateCcw, TrendingDown, Trophy } from 'lucide-react';
import { Player, PlayerStats } from '@/services/playerService';

interface PlayerDetailModalProps {
  isOpen: boolean;
  player: Player | null;
  stats: PlayerStats | undefined;
  onClose: () => void;
}

const POSITION_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  GOALKEEPER: { label: 'Gardien',   bg: 'bg-orange-500/15', text: 'text-orange-400' },
  DEFENDER:   { label: 'Défenseur', bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  MIDFIELDER: { label: 'Milieu',    bg: 'bg-accent-green/15', text: 'text-accent-green' },
  FORWARD:    { label: 'Attaquant', bg: 'bg-red-500/15',    text: 'text-red-400' },
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    'bg-accent-green/10 text-accent-green border-accent-green/20',
  INJURED:   'bg-red-500/10 text-red-400 border-red-500/20',
  SUSPENDED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  RETIRED:   'bg-neutral/10 text-dark-light dark:text-neutral border-neutral/20',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actif', INJURED: 'Blessé', SUSPENDED: 'Suspendu', RETIRED: 'Retraité',
};

const FOOT_LABEL: Record<string, string> = {
  RIGHT: 'Pied droit', LEFT: 'Pied gauche', BOTH: 'Les deux pieds',
};

const ZONE_LABEL: Record<string, string> = {
  INSIDE_BOX: 'Dans la surface',
  OUTSIDE_BOX: 'Hors surface',
  HEADER: 'Tête',
};

const BODY_LABEL: Record<string, string> = {
  LEFT_FOOT: 'Pied gauche',
  RIGHT_FOOT: 'Pied droit',
  HEAD: 'Tête',
};

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}

function StatItem({ icon, label, value, accent }: StatItemProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-dark/30 dark:bg-dark/50 border border-dark-light/10`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral">{label}</p>
        <p className="text-sm font-bold text-dark dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function PlayerDetailModal({ isOpen, player, stats, onClose }: PlayerDetailModalProps) {
  if (!isOpen || !player) return null;

  const pos = player.position ? POSITION_LABELS[player.position] : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-dark-light/10 dark:border-dark-light/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral hover:text-dark dark:hover:text-white hover:bg-dark-light/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 dark:bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-accent-blue" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark dark:text-white leading-tight">
                {player.first_name} {player.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {player.jersey_number && (
                  <span className="text-xs font-semibold bg-dark-light/10 dark:bg-dark-light/30 text-dark-light dark:text-neutral px-2 py-0.5 rounded-full">
                    #{player.jersey_number}
                  </span>
                )}
                {pos && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pos.bg} ${pos.text}`}>
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

        {/* Stats */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!stats ? (
            <p className="text-center text-sm text-neutral py-6">Aucune statistique disponible</p>
          ) : (
            <div className="space-y-5">
              {/* Matchs */}
              <div>
                <h3 className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Participations</h3>
                <div className="grid grid-cols-3 gap-2">
                  <StatItem
                    icon={<Trophy className="w-4 h-4" />}
                    label="Matchs joués"
                    value={stats.total_matches ?? 0}
                    accent="bg-accent-blue/10 text-accent-blue"
                  />
                  <StatItem
                    icon={<Trophy className="w-4 h-4" />}
                    label="Titulaire"
                    value={stats.matches_as_starter ?? 0}
                    accent="bg-accent-green/10 text-accent-green"
                  />
                  <StatItem
                    icon={<Trophy className="w-4 h-4" />}
                    label="Remplaçant"
                    value={stats.matches_as_substitute ?? 0}
                    accent="bg-yellow-500/10 text-yellow-400"
                  />
                </div>
              </div>

              {/* Offensif */}
              <div>
                <h3 className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Offensif</h3>
                <div className="grid grid-cols-2 gap-2">
                  <StatItem
                    icon={<Target className="w-4 h-4" />}
                    label="Buts"
                    value={stats.goals ?? 0}
                    accent="bg-yellow-400/10 text-yellow-400"
                  />
                  <StatItem
                    icon={<Handshake className="w-4 h-4" />}
                    label="Passes décisives"
                    value={stats.assists ?? 0}
                    accent="bg-accent-blue/10 text-accent-blue"
                  />
                </div>
              </div>

              {/* Défensif */}
              <div>
                <h3 className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Défensif</h3>
                <div className="grid grid-cols-2 gap-2">
                  <StatItem
                    icon={<RotateCcw className="w-4 h-4" />}
                    label="Récupérations"
                    value={stats.recoveries ?? 0}
                    accent="bg-accent-green/10 text-accent-green"
                  />
                  <StatItem
                    icon={<TrendingDown className="w-4 h-4" />}
                    label="Pertes de balle"
                    value={stats.ball_losses ?? 0}
                    accent="bg-red-500/10 text-red-400"
                  />
                </div>
              </div>

              {/* Cartons */}
              <div>
                <h3 className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Discipline</h3>
                <div className="grid grid-cols-2 gap-2">
                  <StatItem
                    icon={<ShieldAlert className="w-4 h-4" />}
                    label="Cartons jaunes"
                    value={stats.yellow_cards ?? 0}
                    accent="bg-yellow-500/10 text-yellow-400"
                  />
                  <StatItem
                    icon={<ShieldX className="w-4 h-4" />}
                    label="Cartons rouges"
                    value={stats.red_cards ?? 0}
                    accent="bg-red-500/10 text-red-400"
                  />
                </div>
              </div>

              {/* Buts par zone */}
              {stats.goals_by_zone && Object.keys(stats.goals_by_zone).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Buts par zone</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(stats.goals_by_zone).map(([zone, count]) => (
                      <div key={zone} className="flex flex-col items-center p-3 rounded-xl bg-dark/30 dark:bg-dark/50 border border-dark-light/10">
                        <span className="text-lg font-bold text-dark dark:text-white">{count}</span>
                        <span className="text-xs text-neutral text-center mt-0.5">{ZONE_LABEL[zone] ?? zone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buts par partie du corps */}
              {stats.goals_by_body_part && Object.keys(stats.goals_by_body_part).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Buts par partie du corps</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(stats.goals_by_body_part).map(([part, count]) => (
                      <div key={part} className="flex flex-col items-center p-3 rounded-xl bg-dark/30 dark:bg-dark/50 border border-dark-light/10">
                        <span className="text-lg font-bold text-dark dark:text-white">{count}</span>
                        <span className="text-xs text-neutral text-center mt-0.5">{BODY_LABEL[part] ?? part}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-dark-light/20 dark:border-dark-light rounded-xl text-sm font-medium text-dark-light dark:text-neutral hover:bg-dark-light/5 dark:hover:bg-dark-light/10 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
