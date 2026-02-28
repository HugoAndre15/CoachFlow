'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Club } from '@/services/clubService';
import { teamService, Team, TeamStats } from '@/services/teamService';
import { matchService, Match } from '@/services/matchService';
import { useClubTeam } from '@/contexts/ClubTeamContext';
import ClubLogo from '@/components/ui/ClubLogo';
import StatsCard from './StatsCard';
import {
  Users,
  Shield,
  Trophy,
  Calendar,
  Target,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Clock,
  MapPin,
  Zap,
  BarChart3,
  UserPlus,
  ClipboardList,
} from 'lucide-react';

interface ClubDashboardProps {
  club: Club;
  userName: string;
}

interface AggregatedStats {
  totalPlayers: number;
  totalMatches: number;
  upcomingMatches: number;
  finishedMatches: number;
  liveMatches: number;
  totalGoals: number;
  totalAssists: number;
  totalYellowCards: number;
  totalRedCards: number;
  avgGoalsPerMatch: number;
  topScorer: { playerName: string; goals: number; teamName: string } | null;
  topAssister: { playerName: string; assists: number; teamName: string } | null;
}

function aggregateStats(teamsStats: (TeamStats & { _teamName: string })[]): AggregatedStats {
  const agg: AggregatedStats = {
    totalPlayers: 0,
    totalMatches: 0,
    upcomingMatches: 0,
    finishedMatches: 0,
    liveMatches: 0,
    totalGoals: 0,
    totalAssists: 0,
    totalYellowCards: 0,
    totalRedCards: 0,
    avgGoalsPerMatch: 0,
    topScorer: null,
    topAssister: null,
  };

  for (const ts of teamsStats) {
    agg.totalMatches += ts.totalMatches;
    agg.upcomingMatches += ts.upcomingMatches;
    agg.finishedMatches += ts.finishedMatches;
    agg.liveMatches += ts.liveMatches;
    agg.totalGoals += ts.totalGoals;
    agg.totalAssists += ts.totalAssists;
    agg.totalYellowCards += ts.totalYellowCards;
    agg.totalRedCards += ts.totalRedCards;

    if (ts.topScorer && (!agg.topScorer || ts.topScorer.goals > agg.topScorer.goals)) {
      agg.topScorer = { playerName: ts.topScorer.playerName, goals: ts.topScorer.goals, teamName: ts._teamName };
    }
    if (ts.topAssister && (!agg.topAssister || ts.topAssister.assists > agg.topAssister.assists)) {
      agg.topAssister = { playerName: ts.topAssister.playerName, assists: ts.topAssister.assists, teamName: ts._teamName };
    }
  }

  agg.avgGoalsPerMatch = agg.finishedMatches > 0 ? Math.round((agg.totalGoals / agg.finishedMatches) * 10) / 10 : 0;

  return agg;
}

export default function ClubDashboard({ club, userName }: ClubDashboardProps) {
  const router = useRouter();
  const { allTeams, activeTeam } = useClubTeam();
  const [teamsStats, setTeamsStats] = useState<(TeamStats & { _teamName: string })[]>([]);
  const [recentMatches, setRecentMatches] = useState<(Match & { teamName: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!allTeams.length) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch team stats for all teams in parallel
        const statsPromises = allTeams.map(async (team) => {
          try {
            const stats = await teamService.getTeamStats(team.id);
            return { ...stats, _teamName: team.name };
          } catch {
            return null;
          }
        });

        // Fetch recent matches for active team (or first team)
        const targetTeam = activeTeam || allTeams[0];
        let matches: (Match & { teamName: string })[] = [];
        if (targetTeam) {
          try {
            const m = await matchService.getMatchesByTeam(targetTeam.id, { limit: 5 });
            matches = m.map(match => ({ ...match, teamName: targetTeam.name }));
          } catch { /* ignore */ }
        }

        const results = await Promise.all(statsPromises);
        const validStats = results.filter(Boolean) as (TeamStats & { _teamName: string })[];

        setTeamsStats(validStats);
        setRecentMatches(matches);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [allTeams, activeTeam]);

  const stats = aggregateStats(teamsStats);

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

  const shortcuts = [
    { label: 'Nouveau match', icon: Calendar, href: '/dashboard/matchs', color: 'text-accent-green' },
    { label: 'Ajouter un joueur', icon: UserPlus, href: '/dashboard/joueurs', color: 'text-accent-blue' },
    { label: 'Mes équipes', icon: Shield, href: '/dashboard/teams', color: 'text-purple-400' },
    { label: 'Statistiques', icon: BarChart3, href: activeTeam ? `/dashboard/teams/${activeTeam.id}` : '/dashboard/teams', color: 'text-orange-400' },
    { label: 'Feuille de match', icon: ClipboardList, href: '/dashboard/matchs', color: 'text-accent-red' },
    { label: 'Infos du club', icon: Target, href: `/dashboard/clubs/${club.id}`, color: 'text-teal-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-neutral mb-1">Bienvenue, {userName}</p>
          <div className="flex items-center gap-3">
            <ClubLogo logo={club.logo} name={club.name} size="lg" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-dark dark:text-white leading-tight">
                {club.name}
              </h1>
              {club.city && (
                <p className="text-xs text-neutral flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {club.city}
                </p>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push(`/dashboard/clubs/${club.id}`)}
          className="text-sm text-accent-green hover:text-accent-green/80 font-medium flex items-center gap-1 transition-colors"
        >
          Voir le club <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-lighter rounded-xl border border-neutral/10 dark:border-dark-light p-6 animate-pulse">
              <div className="h-3 bg-neutral/20 dark:bg-dark-light rounded w-1/2 mb-3" />
              <div className="h-8 bg-neutral/20 dark:bg-dark-light rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Équipes"
            value={allTeams.length}
            subtitle={`${stats.totalPlayers || allTeams.reduce((acc, t) => acc + (t._count?.players || 0), 0)} joueurs au total`}
            icon={<Shield className="w-5 h-5" />}
            iconBgColor="bg-purple-500/10 dark:bg-purple-500/20"
            iconColor="text-purple-400"
          />
          <StatsCard
            title="Matchs joués"
            value={stats.finishedMatches}
            subtitle={stats.upcomingMatches > 0 ? `${stats.upcomingMatches} à venir` : 'Aucun programmé'}
            icon={<Trophy className="w-5 h-5" />}
            iconBgColor="bg-accent-green/10 dark:bg-accent-green/20"
            iconColor="text-accent-green"
          />
          <StatsCard
            title="Buts marqués"
            value={stats.totalGoals}
            subtitle={`${stats.avgGoalsPerMatch} buts/match en moy.`}
            icon={<Target className="w-5 h-5" />}
            iconBgColor="bg-accent-blue/10 dark:bg-accent-blue/20"
            iconColor="text-accent-blue"
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

      {/* Main Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Matches */}
          <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-green" />
                Derniers matchs
                {activeTeam && <span className="text-xs text-neutral font-normal">· {activeTeam.name}</span>}
              </h3>
              <button
                onClick={() => router.push('/dashboard/matchs')}
                className="text-xs text-accent-green hover:text-accent-green/80 font-medium flex items-center gap-1"
              >
                Tout voir <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-neutral/5 dark:bg-dark-light/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentMatches.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-neutral/40 mx-auto mb-2" />
                <p className="text-sm text-neutral">Aucun match pour le moment</p>
                <button
                  onClick={() => router.push('/dashboard/matchs')}
                  className="mt-2 text-xs text-accent-green hover:underline"
                >
                  Planifier un match
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentMatches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => router.push(`/dashboard/matchs`)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral/5 dark:hover:bg-dark-light/30 transition-colors cursor-pointer group"
                  >
                    <div className="text-center min-w-[48px]">
                      <p className="text-xs font-bold text-dark dark:text-white">{formatDate(match.match_date)}</p>
                      <p className="text-[10px] text-neutral">{formatTime(match.match_date)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark dark:text-white truncate">
                        {match.location === 'HOME' ? `${match.teamName} vs ${match.opponent}` : `${match.opponent} vs ${match.teamName}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-neutral flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {match.location === 'HOME' ? 'Domicile' : 'Extérieur'}
                        </span>
                        {match.score && match.status === 'FINISHED' && (
                          <span className="text-xs font-bold text-dark dark:text-white">
                            {match.score.home} - {match.score.away}
                          </span>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(match.status)}
                    <ChevronRight className="w-4 h-4 text-neutral/30 group-hover:text-accent-green transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teams Overview */}
          <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                Aperçu des équipes
              </h3>
              <button
                onClick={() => router.push('/dashboard/teams')}
                className="text-xs text-accent-green hover:text-accent-green/80 font-medium flex items-center gap-1"
              >
                Gérer <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-neutral/5 dark:bg-dark-light/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : teamsStats.length === 0 ? (
              <p className="text-sm text-neutral text-center py-6">Aucune statistique disponible</p>
            ) : (
              <div className="space-y-2">
                {teamsStats.map((ts) => (
                  <div
                    key={ts.teamId}
                    onClick={() => router.push(`/dashboard/teams/${ts.teamId}`)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral/5 dark:hover:bg-dark-light/30 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark dark:text-white">{ts._teamName}</p>
                      <p className="text-[11px] text-neutral">
                        {ts.category} · {ts.totalMatches} match{ts.totalMatches !== 1 ? 's' : ''} · {ts.totalGoals} but{ts.totalGoals !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right hidden sm:block">
                      {ts.topScorer && (
                        <p className="text-[10px] text-neutral">
                          <span className="text-accent-green font-medium">{ts.topScorer.playerName}</span> {ts.topScorer.goals} but{ts.topScorer.goals !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral/30 group-hover:text-accent-green transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
            <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-accent-green" />
              Raccourcis
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((s) => (
                <button
                  key={s.label}
                  onClick={() => router.push(s.href)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-neutral/5 dark:hover:bg-dark-light/30 transition-colors text-center group"
                >
                  <div className="w-9 h-9 rounded-lg bg-neutral/5 dark:bg-dark-light/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <span className="text-[11px] font-medium text-dark-light dark:text-neutral leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          {!isLoading && (stats.topScorer || stats.topAssister) && (
            <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
              <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-accent-green" />
                Meilleurs joueurs
              </h3>
              <div className="space-y-3">
                {stats.topScorer && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-green/5 dark:bg-accent-green/10">
                    <div className="w-9 h-9 rounded-full bg-accent-green/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-accent-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark dark:text-white truncate">{stats.topScorer.playerName}</p>
                      <p className="text-[10px] text-neutral">{stats.topScorer.teamName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-accent-green">{stats.topScorer.goals}</p>
                      <p className="text-[9px] text-neutral uppercase tracking-wide">buts</p>
                    </div>
                  </div>
                )}
                {stats.topAssister && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-blue/5 dark:bg-accent-blue/10">
                    <div className="w-9 h-9 rounded-full bg-accent-blue/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-accent-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark dark:text-white truncate">{stats.topAssister.playerName}</p>
                      <p className="text-[10px] text-neutral">{stats.topAssister.teamName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-accent-blue">{stats.topAssister.assists}</p>
                      <p className="text-[9px] text-neutral uppercase tracking-wide">assists</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Match Alert */}
          {!isLoading && stats.liveMatches > 0 && (
            <div className="bg-gradient-to-br from-accent-red/10 to-accent-red/5 dark:from-accent-red/20 dark:to-accent-red/10 rounded-2xl border border-accent-red/20 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
                <p className="text-sm font-bold text-accent-red">Match en cours</p>
              </div>
              <p className="text-xs text-dark-light dark:text-neutral">
                {stats.liveMatches} match{stats.liveMatches > 1 ? 's' : ''} en direct
              </p>
              <button
                onClick={() => router.push('/dashboard/direct')}
                className="mt-3 text-xs font-medium text-accent-red hover:underline flex items-center gap-1"
              >
                Suivre en direct <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Club Info Quick Card */}
          <div className="bg-white dark:bg-dark-lighter rounded-2xl border border-neutral/10 dark:border-dark-light p-6">
            <h3 className="font-semibold text-dark dark:text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-neutral" />
              Informations
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral">Rôle</span>
                <span className="text-dark dark:text-white font-medium capitalize">
                  {club.role === 'PRESIDENT' ? 'Président' : club.role === 'RESPONSABLE' ? 'Responsable' : 'Coach'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral">Équipes</span>
                <span className="text-dark dark:text-white font-medium">{allTeams.length}</span>
              </div>
              {club.invite_code && (
                <div className="flex justify-between">
                  <span className="text-neutral">Code invitation</span>
                  <span className="text-dark dark:text-white font-mono text-xs tracking-wider">{club.invite_code}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral">Créé le</span>
                <span className="text-dark dark:text-white font-medium text-xs">
                  {new Date(club.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
