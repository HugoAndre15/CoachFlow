'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { teamService, Team, TeamStats, TeamPlayerStats } from '@/services/teamService';
import { matchService, Match } from '@/services/matchService';
import { useClubTeam } from '@/contexts/ClubTeamContext';
import ClubLogo from '@/components/ui/ClubLogo';
import StatsCard from '../../parts/StatsCard';
import EditTeamModal from '../parts/EditTeamModal';
import DeleteTeamModal from '../parts/DeleteTeamModal';
import {
  ArrowLeft,
  Shield,
  Users,
  Trophy,
  Target,
  Calendar,
  ChevronRight,
  MapPin,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Crosshair,
  Award,
  Shirt,
  Pencil,
  Trash2,
} from 'lucide-react';

const positionLabel = (pos?: string) => {
  switch (pos) {
    case 'GOALKEEPER': return 'Gardien';
    case 'DEFENDER': return 'Défenseur';
    case 'MIDFIELDER': return 'Milieu';
    case 'FORWARD': return 'Attaquant';
    default: return pos || '—';
  }
};

const positionColor = (pos?: string) => {
  switch (pos) {
    case 'GOALKEEPER': return 'text-amber-500 bg-amber-500/10';
    case 'DEFENDER': return 'text-accent-blue bg-accent-blue/10';
    case 'MIDFIELDER': return 'text-accent-green bg-accent-green/10';
    case 'FORWARD': return 'text-accent-red bg-accent-red/10';
    default: return 'text-neutral bg-neutral/10';
  }
};

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { activeClub } = useClubTeam();
  const [team, setTeam] = useState<Team | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [playersStats, setPlayersStats] = useState<TeamPlayerStats[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [teamData, teamStats, pStats, matches] = await Promise.allSettled([
        teamService.getTeam(id),
        teamService.getTeamStats(id),
        teamService.getTeamPlayersStats(id),
        matchService.getMatchesByTeam(id, { limit: 10 }),
      ]);

      if (teamData.status === 'fulfilled') setTeam(teamData.value);
      else throw new Error('Équipe introuvable');

      if (teamStats.status === 'fulfilled') setStats(teamStats.value);
      if (pStats.status === 'fulfilled') setPlayersStats(pStats.value);
      if (matches.status === 'fulfilled') setRecentMatches(matches.value);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-red/20 text-accent-red animate-pulse">EN DIRECT</span>;
      case 'FINISHED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral/20 text-neutral">TERMINÉ</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/20 text-accent-blue">À VENIR</span>;
    }
  };

  const getResultBadge = (match: Match) => {
    if (match.status !== 'FINISHED' || !match.score) return null;
    const myGoals = match.score.home;
    const theirGoals = match.score.away;

    if (myGoals > theirGoals) return <span className="w-6 h-6 rounded-full bg-accent-green/20 text-accent-green text-[10px] font-bold flex items-center justify-center">V</span>;
    if (myGoals < theirGoals) return <span className="w-6 h-6 rounded-full bg-accent-red/20 text-accent-red text-[10px] font-bold flex items-center justify-center">D</span>;
    return <span className="w-6 h-6 rounded-full bg-neutral/20 text-neutral text-[10px] font-bold flex items-center justify-center">N</span>;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-neutral/10 dark:bg-dark-light rounded w-32" />
        <div className="h-32 bg-neutral/10 dark:bg-dark-light rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral/10 dark:bg-dark-light rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <p className="text-accent-red font-medium">{error || 'Équipe introuvable'}</p>
        <button onClick={() => router.back()} className="mt-3 text-sm text-accent-green hover:underline">
          Retour
        </button>
      </div>
    );
  }

  const finishedMatches = recentMatches.filter(m => m.status === 'FINISHED');
  const wins = finishedMatches.filter(m => {
    if (!m.score) return false;
    return m.score.home > m.score.away;
  }).length;
  const draws = finishedMatches.filter(m => m.score && m.score.home === m.score.away).length;
  const losses = finishedMatches.length - wins - draws;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-neutral hover:text-dark dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      {/* Team Header */}
      <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-7 h-7 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-dark dark:text-white">{team.name}</h1>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-accent-green/10 text-accent-green">
                {team.category}
              </span>
            </div>

            {activeClub && (
              <div className="flex items-center gap-2 mt-1">
                <ClubLogo logo={activeClub.logo} name={activeClub.name} size="xs" />
                <span className="text-sm text-neutral">{activeClub.name}</span>
              </div>
            )}

            {team.myRole && (
              <p className="text-xs text-neutral mt-2">
                Votre rôle : <span className="text-dark dark:text-white font-medium">
                  {team.myRole === 'COACH' ? 'Coach' : team.myRole === 'ASSISTANT_COACH' ? 'Coach assistant' : team.myRole}
                </span>
              </p>
            )}
          </div>

          {/* Win/Draw/Loss mini display */}
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2.5 rounded-xl bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/20 dark:hover:bg-accent-blue/30 transition-colors"
              title="Modifier l'équipe"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2.5 rounded-xl bg-accent-red/10 dark:bg-accent-red/20 text-accent-red hover:bg-accent-red/20 dark:hover:bg-accent-red/30 transition-colors"
              title="Supprimer l'équipe"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {finishedMatches.length > 0 && (
            <div className="flex items-center gap-3 bg-neutral/5 dark:bg-dark-light/50 rounded-xl px-4 py-2.5">
              <div className="text-center">
                <p className="text-lg font-bold text-accent-green">{wins}</p>
                <p className="text-[9px] text-neutral uppercase">Vict.</p>
              </div>
              <div className="w-px h-8 bg-neutral/20 dark:bg-dark-light" />
              <div className="text-center">
                <p className="text-lg font-bold text-neutral">{draws}</p>
                <p className="text-[9px] text-neutral uppercase">Nuls</p>
              </div>
              <div className="w-px h-8 bg-neutral/20 dark:bg-dark-light" />
              <div className="text-center">
                <p className="text-lg font-bold text-accent-red">{losses}</p>
                <p className="text-[9px] text-neutral uppercase">Déf.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Matchs"
            value={stats.totalMatches}
            subtitle={`${stats.upcomingMatches} à venir`}
            icon={<Trophy className="w-5 h-5" />}
            iconBgColor="bg-accent-green/10 dark:bg-accent-green/20"
            iconColor="text-accent-green"
          />
          <StatsCard
            title="Buts"
            value={stats.totalGoals}
            subtitle={`${stats.averageGoalsPerMatch} /match en moy.`}
            icon={<Target className="w-5 h-5" />}
            iconBgColor="bg-accent-blue/10 dark:bg-accent-blue/20"
            iconColor="text-accent-blue"
          />
          <StatsCard
            title="Passes D."
            value={stats.totalAssists}
            subtitle={stats.topAssister ? `Meilleur: ${stats.topAssister.playerName}` : 'Aucune encore'}
            icon={<Crosshair className="w-5 h-5" />}
            iconBgColor="bg-purple-500/10 dark:bg-purple-500/20"
            iconColor="text-purple-400"
          />
          <StatsCard
            title="Cartons"
            value={stats.totalYellowCards + stats.totalRedCards}
            subtitle={`${stats.totalYellowCards} jaunes · ${stats.totalRedCards} rouges`}
            icon={<AlertTriangle className="w-5 h-5" />}
            iconBgColor="bg-orange-500/10 dark:bg-orange-500/20"
            iconColor="text-orange-400"
          />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Matches + Players (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Matches */}
          <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-green" />
                Historique des matchs
              </h3>
              <button
                onClick={() => router.push('/dashboard/matchs')}
                className="text-xs text-accent-green hover:text-accent-green/80 font-medium flex items-center gap-1"
              >
                Tous les matchs <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentMatches.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-neutral/40 mx-auto mb-2" />
                <p className="text-sm text-neutral">Aucun match enregistré</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral/5 dark:hover:bg-dark-light/30 transition-colors cursor-pointer group"
                  >
                    {getResultBadge(match)}
                    <div className="text-center min-w-[44px]">
                      <p className="text-xs font-bold text-dark dark:text-white">{formatDate(match.match_date)}</p>
                      <p className="text-[10px] text-neutral">{formatTime(match.match_date)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark dark:text-white truncate">
                        {match.location === 'HOME' ? `vs ${match.opponent}` : `@ ${match.opponent}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-neutral flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {match.location === 'HOME' ? 'Domicile' : 'Extérieur'}
                        </span>
                      </div>
                    </div>
                    {match.score && match.status === 'FINISHED' && (
                      <span className="text-sm font-bold text-dark dark:text-white tabular-nums">
                        {match.score.home} - {match.score.away}
                      </span>
                    )}
                    {getStatusBadge(match.status)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Players Stats Table */}
          <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent-blue" />
                Statistiques joueurs
              </h3>
              <button
                onClick={() => router.push('/dashboard/joueurs')}
                className="text-xs text-accent-green hover:text-accent-green/80 font-medium flex items-center gap-1"
              >
                Tous les joueurs <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {playersStats.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-neutral/40 mx-auto mb-2" />
                <p className="text-sm text-neutral">Aucune statistique joueur</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral/10 dark:border-dark-light">
                      <th className="text-left text-[10px] uppercase tracking-wider text-neutral font-medium py-2 px-6">Joueur</th>
                      <th className="text-center text-[10px] uppercase tracking-wider text-neutral font-medium py-2 px-2">MJ</th>
                      <th className="text-center text-[10px] uppercase tracking-wider text-neutral font-medium py-2 px-2">Buts</th>
                      <th className="text-center text-[10px] uppercase tracking-wider text-neutral font-medium py-2 px-2">PD</th>
                      <th className="text-center text-[10px] uppercase tracking-wider text-neutral font-medium py-2 px-2 hidden sm:table-cell">CJ</th>
                      <th className="text-center text-[10px] uppercase tracking-wider text-neutral font-medium py-2 px-2 hidden sm:table-cell">CR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playersStats.slice(0, 10).map((p, i) => (
                      <tr
                        key={p.playerId}
                        className="border-b border-neutral/5 dark:border-dark-light/30 hover:bg-neutral/5 dark:hover:bg-dark-light/20 transition-colors"
                      >
                        <td className="py-2.5 px-6">
                          <div className="flex items-center gap-2">
                            {p.jerseyNumber && (
                              <span className="text-[10px] font-bold text-neutral w-5 text-right">{p.jerseyNumber}</span>
                            )}
                            <span className="font-medium text-dark dark:text-white text-sm truncate max-w-[140px]">
                              {p.playerName}
                            </span>
                            {p.position && (
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${positionColor(p.position)}`}>
                                {positionLabel(p.position).slice(0, 3).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-2.5 px-2 text-neutral">{p.matchesPlayed}</td>
                        <td className="text-center py-2.5 px-2 font-semibold text-dark dark:text-white">{p.goals}</td>
                        <td className="text-center py-2.5 px-2 text-accent-blue">{p.assists}</td>
                        <td className="text-center py-2.5 px-2 text-amber-500 hidden sm:table-cell">{p.yellowCards}</td>
                        <td className="text-center py-2.5 px-2 text-accent-red hidden sm:table-cell">{p.redCards}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          {/* Top Scorer */}
          {stats?.topScorer && (
            <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
              <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-accent-green" />
                Meilleur buteur
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-green/5 dark:bg-accent-green/10">
                <div className="w-11 h-11 rounded-full bg-accent-green/20 flex items-center justify-center">
                  {stats.topScorer.jerseyNumber ? (
                    <span className="text-sm font-bold text-accent-green">{stats.topScorer.jerseyNumber}</span>
                  ) : (
                    <Target className="w-5 h-5 text-accent-green" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark dark:text-white">{stats.topScorer.playerName}</p>
                  <p className="text-xs text-neutral">{stats.topScorer.goals} but{stats.topScorer.goals !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          )}

          {/* Top Assister */}
          {stats?.topAssister && (
            <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
              <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-accent-blue" />
                Meilleur passeur
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-blue/5 dark:bg-accent-blue/10">
                <div className="w-11 h-11 rounded-full bg-accent-blue/20 flex items-center justify-center">
                  {stats.topAssister.jerseyNumber ? (
                    <span className="text-sm font-bold text-accent-blue">{stats.topAssister.jerseyNumber}</span>
                  ) : (
                    <Crosshair className="w-5 h-5 text-accent-blue" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark dark:text-white">{stats.topAssister.playerName}</p>
                  <p className="text-xs text-neutral">{stats.topAssister.assists} passe{stats.topAssister.assists !== 1 ? 's' : ''} décisive{stats.topAssister.assists !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recoveries / Ball Losses */}
          {stats && (stats.totalRecoveries > 0 || stats.totalBallLosses > 0) && (
            <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
              <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2 mb-4">
                <Shirt className="w-4 h-4 text-neutral" />
                Possession
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral">Récupérations</span>
                  <span className="text-sm font-bold text-accent-green">{stats.totalRecoveries}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral">Pertes de balle</span>
                  <span className="text-sm font-bold text-accent-red">{stats.totalBallLosses}</span>
                </div>
                {stats.totalRecoveries + stats.totalBallLosses > 0 && (
                  <div className="mt-2">
                    <div className="h-2 rounded-full bg-neutral/10 dark:bg-dark-light overflow-hidden flex">
                      <div
                        className="h-full bg-accent-green rounded-full transition-all"
                        style={{
                          width: `${(stats.totalRecoveries / (stats.totalRecoveries + stats.totalBallLosses)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] text-accent-green">
                        {Math.round((stats.totalRecoveries / (stats.totalRecoveries + stats.totalBallLosses)) * 100)}%
                      </span>
                      <span className="text-[9px] text-accent-red">
                        {Math.round((stats.totalBallLosses / (stats.totalRecoveries + stats.totalBallLosses)) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Match Form (last 5) */}
          {finishedMatches.length > 0 && (
            <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
              <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Forme récente
              </h3>
              <div className="flex items-center gap-1.5 justify-center">
                {finishedMatches.slice(0, 5).map((m) => {
                  if (!m.score) return null;
                  const my = m.score.home;
                  const their = m.score.away;
                  const result = my > their ? 'V' : my < their ? 'D' : 'N';
                  const color = result === 'V' ? 'bg-accent-green text-white' : result === 'D' ? 'bg-accent-red text-white' : 'bg-neutral/30 text-dark dark:text-white';
                  return (
                    <div
                      key={m.id}
                      className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center text-xs font-bold`}
                      title={`${m.opponent} (${m.score.home}-${m.score.away})`}
                    >
                      {result}
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-[10px] text-neutral mt-2">
                {wins}V {draws}N {losses}D sur les {finishedMatches.length} derniers
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Modals */}
      {team && (
        <>
          <EditTeamModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => fetchData()}
            team={team}
          />
          <DeleteTeamModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={() => router.push('/dashboard/teams')}
            teamId={team.id}
            teamName={team.name}
          />
        </>
      )}
    </div>
  );
}
