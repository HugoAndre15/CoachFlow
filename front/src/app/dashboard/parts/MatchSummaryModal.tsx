'use client';

import { useState, useEffect } from 'react';
import {
  X, Trophy, Clock, MapPin, Users, Shield, AlertTriangle,
  ArrowDownCircle, ArrowUpCircle, Target, ArrowLeftRight,
} from 'lucide-react';
import { matchService } from '@/services/matchService';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MatchStats {
  matchId: string;
  opponent: string;
  matchDate: string;
  location: string;
  status: string;
  totalPlayers: number;
  totalGoals: number;
  totalOpponentGoals: number;
  totalAssists: number;
  totalYellowCards: number;
  totalRedCards: number;
  totalRecoveries: number;
  totalBallLosses: number;
  topScorer: { playerId: string; playerName: string; jerseyNumber: number | null; goals: number } | null;
  topAssister: { playerId: string; playerName: string; jerseyNumber: number | null; assists: number } | null;
  eventsByType: Record<string, number>;
  timeline: {
    minute: number;
    eventType: string;
    playerName: string;
    jerseyNumber: number | null;
    createdAt?: string;
  }[];
}

// ─── Event display config ───────────────────────────────────────────────────

const EVENT_DISPLAY: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  GOAL: {
    label: 'But',
    icon: <Target className="w-3.5 h-3.5" />,
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
  },
  ASSIST: {
    label: 'Passe dé.',
    icon: <ArrowUpCircle className="w-3.5 h-3.5" />,
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
  },
  YELLOW_CARD: {
    label: 'Carton jaune',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
  },
  RED_CARD: {
    label: 'Carton rouge',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: 'text-accent-red',
    bg: 'bg-accent-red/10',
  },
  RECOVERY: {
    label: 'Récupération',
    icon: <ArrowDownCircle className="w-3.5 h-3.5" />,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
  },
  BALL_LOSS: {
    label: 'Perte de balle',
    icon: <ArrowUpCircle className="w-3.5 h-3.5" />,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  SUBSTITUTION: {
    label: 'Changement',
    icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function MatchSummaryModal({
  isOpen,
  onClose,
  matchId,
  teamName,
}: {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  teamName: string;
}) {
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !matchId) return;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await matchService.getMatchStats(matchId);
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des statistiques');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isOpen, matchId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-white dark:bg-dark-lighter border-b border-neutral/10 dark:border-dark-light rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent-green" />
            <h2 className="text-lg font-bold text-dark dark:text-white">Résumé du match</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-light/50 dark:text-neutral/50 hover:bg-neutral/10 dark:hover:bg-dark-secondary/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
              <p className="text-sm text-dark-light/60 dark:text-neutral/50 mt-3">Chargement des statistiques…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="w-8 h-8 text-accent-red mb-3" />
              <p className="text-sm text-accent-red font-medium">{error}</p>
              <button onClick={onClose} className="mt-3 text-sm text-accent-green hover:underline">
                Fermer
              </button>
            </div>
          )}

          {stats && !isLoading && !error && (
            <>
              {/* ── Match info header ──────────────────────────────────── */}
              <div className="bg-neutral-lighter/30 dark:bg-dark-secondary/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  {/* Our team */}
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-accent-green/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-accent-green" />
                    </div>
                    <p className="text-sm font-bold text-dark dark:text-white">{teamName}</p>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center px-6">
                    <div className="text-3xl font-black text-dark dark:text-white">
                      {stats.totalGoals} - {stats.totalOpponentGoals}
                    </div>
                    <span className="text-[10px] text-dark-light/50 dark:text-neutral/50 uppercase tracking-wide mt-1">
                      Score
                    </span>
                  </div>

                  {/* Opponent */}
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-accent-red/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-accent-red" />
                    </div>
                    <p className="text-sm font-bold text-dark dark:text-white">{stats.opponent}</p>
                  </div>
                </div>

                {/* Match meta */}
                <div className="flex items-center justify-center gap-4 text-xs text-dark-light/60 dark:text-neutral/50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateFull(stats.matchDate)} à {formatTime(stats.matchDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {stats.location === 'HOME' ? 'Domicile' : 'Extérieur'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {stats.totalPlayers} joueur{stats.totalPlayers !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* ── Key stats grid ─────────────────────────────────────── */}
              <div>
                <h3 className="text-xs font-semibold text-dark-light/60 dark:text-neutral/60 uppercase tracking-wide mb-3">
                  Statistiques clés
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    { label: 'Buts', value: stats.totalGoals, color: 'text-accent-green', bg: 'bg-accent-green/10' },
                    { label: 'Passes dé.', value: stats.totalAssists, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
                    { label: 'C. Jaunes', value: stats.totalYellowCards, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' },
                    { label: 'C. Rouges', value: stats.totalRedCards, color: 'text-accent-red', bg: 'bg-accent-red/10' },
                    { label: 'Récup.', value: stats.totalRecoveries, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
                    { label: 'Pertes', value: stats.totalBallLosses, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center`}>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-dark-light/60 dark:text-neutral/50 font-medium mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Top performers ─────────────────────────────────────── */}
              {(stats.topScorer || stats.topAssister) && (
                <div>
                  <h3 className="text-xs font-semibold text-dark-light/60 dark:text-neutral/60 uppercase tracking-wide mb-3">
                    Joueurs clés
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stats.topScorer && (
                      <div className="flex items-center gap-3 bg-accent-green/5 border border-accent-green/20 rounded-xl p-3">
                        <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green font-bold text-sm">
                          {stats.topScorer.jerseyNumber ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-dark dark:text-white truncate">
                            {stats.topScorer.playerName}
                          </p>
                          <p className="text-xs text-accent-green font-medium">
                            {stats.topScorer.goals} but{stats.topScorer.goals !== 1 ? 's' : ''} ⚽
                          </p>
                        </div>
                      </div>
                    )}
                    {stats.topAssister && (
                      <div className="flex items-center gap-3 bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-3">
                        <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue font-bold text-sm">
                          {stats.topAssister.jerseyNumber ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-dark dark:text-white truncate">
                            {stats.topAssister.playerName}
                          </p>
                          <p className="text-xs text-accent-blue font-medium">
                            {stats.topAssister.assists} passe{stats.topAssister.assists !== 1 ? 's' : ''} dé. 🎯
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Timeline ───────────────────────────────────────────── */}
              {stats.timeline.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-dark-light/60 dark:text-neutral/60 uppercase tracking-wide mb-3">
                    Chronologie ({stats.timeline.length} événement{stats.timeline.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="relative space-y-0">
                    {/* Vertical line */}
                    <div className="absolute left-[23px] top-2 bottom-2 w-px bg-neutral/20 dark:bg-dark-light" />

                    {stats.timeline.map((event, idx) => {
                      const cfg = EVENT_DISPLAY[event.eventType] || {
                        label: event.eventType,
                        icon: <Clock className="w-3.5 h-3.5" />,
                        color: 'text-dark-light',
                        bg: 'bg-neutral/10',
                      };

                      return (
                        <div key={idx} className="relative flex items-start gap-3 py-1.5">
                          {/* Minute bubble */}
                          <div className={`relative z-10 flex items-center justify-center w-[46px] h-7 rounded-full ${cfg.bg} ${cfg.color} text-[11px] font-bold shrink-0`}>
                            {event.minute}&apos;
                          </div>

                          {/* Event detail */}
                          <div className="flex-1 flex items-center gap-2 min-w-0 py-0.5">
                            <span className={cfg.color}>{cfg.icon}</span>
                            <span className="text-sm text-dark dark:text-white font-medium truncate">
                              {event.jerseyNumber != null && (
                                <span className="text-dark-light/40 dark:text-neutral/40 mr-1">#{event.jerseyNumber}</span>
                              )}
                              {event.playerName}
                            </span>
                            <span className={`text-xs font-medium ${cfg.color} shrink-0`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state for timeline */}
              {stats.timeline.length === 0 && (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 text-neutral mx-auto mb-2" />
                  <p className="text-sm text-dark-light/60 dark:text-neutral/50">Aucun événement enregistré pour ce match</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
