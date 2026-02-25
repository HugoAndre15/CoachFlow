'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Target, Award, Star, TrendingUp, Activity, Zap } from 'lucide-react';
import { playerService, Player, PlayerStats } from '@/services/playerService';
import { Team } from '@/services/teamService';
import CreatePlayerModal from './parts/CreatePlayerModal';
import PlayerDetailModal from './parts/PlayerDetailModal';
import EditPlayerModal from './parts/EditPlayerModal';
import JoueursHeader from './parts/JoueursHeader';
import JoueursFilters from './parts/JoueursFilters';
import JoueursLoadingState from './parts/JoueursLoadingState';
import NoTeamState from './parts/NoTeamState';
import NoPlayersState from './parts/NoPlayersState';
import PlayerTable from './parts/PlayerTable';
import DeleteConfirmModal from './parts/DeleteConfirmModal';
import StatCard from './parts/StatCard';
import TopCard from './parts/TopCard';
// --- Component ---------------------------------------------------------------
export default function JoueursPage() {
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, PlayerStats>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  // Charger depuis localStorage au montage
  useEffect(() => {
    const savedTeamId = localStorage.getItem('activeTeamId');
    const savedTeamName = localStorage.getItem('activeTeamName');
    const savedTeamCategory = localStorage.getItem('activeTeamCategory');
    if (savedTeamId && savedTeamName) {
      setActiveTeam({ id: savedTeamId, name: savedTeamName, category: savedTeamCategory || '', club_id: '' });
    }
  }, []);
  // Ecouter les changements d'equipe
  useEffect(() => {
    const handler = (e: CustomEvent<Team>) => {
      setActiveTeam(e.detail);
      localStorage.setItem('activeTeamName', e.detail.name);
      localStorage.setItem('activeTeamCategory', e.detail.category);
    };
    window.addEventListener('activeTeamChanged', handler as EventListener);
    return () => window.removeEventListener('activeTeamChanged', handler as EventListener);
  }, []);
  const fetchPlayers = useCallback(async (teamId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setStatsMap({});
      const data = await playerService.getPlayersByTeam(teamId);
      setPlayers(data);
      if (data.length > 0) {
        setIsLoadingStats(true);
        const statsResults = await Promise.allSettled(
          data.map(p => playerService.getPlayerStats(p.id).then(s => ({ id: p.id, stats: s })))
        );
        const map: Record<string, PlayerStats> = {};
        statsResults.forEach(r => {
          if (r.status === 'fulfilled') map[r.value.id] = r.value.stats;
        });
        setStatsMap(map);
        setIsLoadingStats(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des joueurs');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    if (activeTeam?.id) fetchPlayers(activeTeam.id);
  }, [activeTeam?.id, fetchPlayers]);
  // Filtres
  const filtered = useMemo(() => players.filter(p => {
    if (positionFilter && p.position !== positionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.first_name.toLowerCase().includes(q) &&
        !p.last_name.toLowerCase().includes(q) &&
        !(p.jersey_number?.toString() ?? '').includes(q)
      ) return false;
    }
    return true;
  }), [players, positionFilter, search]);
  // Stats globales
  const globalStats = useMemo(() => {
    const allStats = Object.values(statsMap);
    return {
      totalGoals:   allStats.reduce((s, x) => s + (x.goals ?? 0), 0),
      totalAssists: allStats.reduce((s, x) => s + (x.assists ?? 0), 0),
      totalRecov:   allStats.reduce((s, x) => s + (x.recoveries ?? 0), 0),
    };
  }, [statsMap]);
  // Top performers
  const topPerformers = useMemo(() => {
    const entries = Object.entries(statsMap);
    const byGoals   = [...entries].sort((a, b) => (b[1].goals ?? 0) - (a[1].goals ?? 0))[0];
    const byAssists = [...entries].sort((a, b) => (b[1].assists ?? 0) - (a[1].assists ?? 0))[0];
    const byRecov   = [...entries].sort((a, b) => (b[1].recoveries ?? 0) - (a[1].recoveries ?? 0))[0];
    const findName  = (id: string) => {
      const p = players.find(x => x.id === id);
      return p ? p.first_name + ' ' + p.last_name : '-';
    };
    return {
      scorer: byGoals   ? { name: findName(byGoals[0]),   value: byGoals[1].goals + ' but' + (byGoals[1].goals !== 1 ? 's' : '') }         : null,
      assist: byAssists ? { name: findName(byAssists[0]), value: byAssists[1].assists + ' passe' + (byAssists[1].assists !== 1 ? 's' : '') } : null,
      recov:  byRecov   ? { name: findName(byRecov[0]),   value: byRecov[1].recoveries + ' recup.' }                                         : null,
    };
  }, [statsMap, players]);
  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    if (activeTeam?.id) fetchPlayers(activeTeam.id);
  };
  const handleDelete = async (playerId: string) => {
    try {
      await playerService.deletePlayer(playerId);
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      setStatsMap(prev => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };
  // --- Render ------------------------------------------------------------------
  return (
    <div className="relative min-h-screen">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 w-96 h-96 bg-accent-green rounded-full blur-3xl opacity-[0.06] dark:opacity-[0.09] animate-[landing-float_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-accent-blue rounded-full blur-3xl opacity-[0.05] dark:opacity-[0.07] animate-[landing-float-delayed_10s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-red-500 rounded-full blur-3xl opacity-[0.04] dark:opacity-[0.06] animate-[landing-float_12s_ease-in-out_infinite_2s]" />
        <div className="absolute top-2/3 left-10 w-48 h-48 bg-accent-green rounded-full blur-2xl opacity-[0.03] dark:opacity-[0.05] animate-[landing-float-delayed_9s_ease-in-out_infinite_1s]" />
      </div>
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <JoueursHeader
          activeTeam={activeTeam}
          isLoading={isLoading}
          onRefresh={() => activeTeam && fetchPlayers(activeTeam.id)}
          onAdd={() => setIsModalOpen(true)}
        />
        {/* No team / Loading / Error / Content */}
        {!activeTeam ? (
          <NoTeamState />
        ) : isLoading ? (
          <JoueursLoadingState />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-red-400 font-medium">{error}</p>
            <button onClick={() => fetchPlayers(activeTeam.id)} className="mt-3 text-sm text-accent-green hover:underline">
              Réessayer
            </button>
          </div>
        ) : (
          <>
            {/* Global stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="w-4 h-4 text-accent-green" />}
                label="Effectif total"
                value={players.length}
                sub={players.filter(p => p.status === 'ACTIVE').length + ' actifs'}
                barColor="bg-accent-green"
              />
              <StatCard
                icon={<Target className="w-4 h-4 text-yellow-400" />}
                label="Buts marqués"
                value={globalStats.totalGoals}
                sub={'moy. ' + (players.length > 0 ? (globalStats.totalGoals / players.length).toFixed(1) : 0) + ' / joueur'}
                barColor="bg-yellow-400"
              />
              <StatCard
                icon={<Award className="w-4 h-4 text-accent-blue" />}
                label="Passes décisives"
                value={globalStats.totalAssists}
                sub={'moy. ' + (players.length > 0 ? (globalStats.totalAssists / players.length).toFixed(1) : 0) + ' / joueur'}
                barColor="bg-accent-blue"
              />
              <StatCard
                icon={<Zap className="w-4 h-4 text-purple-400" />}
                label="Récupérations"
                value={globalStats.totalRecov}
                sub={'moy. ' + (players.length > 0 ? (globalStats.totalRecov / players.length).toFixed(1) : 0) + ' / joueur'}
                barColor="bg-purple-400"
              />
            </div>
            {/* Top performers */}
            {Object.keys(statsMap).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TopCard
                  icon={<Star className="w-4 h-4 text-yellow-400" />}
                  title="Meilleur Buteur"
                  name={topPerformers.scorer?.name ?? '-'}
                  value={topPerformers.scorer?.value ?? '0 but'}
                  accentText="text-yellow-400"
                />
                <TopCard
                  icon={<TrendingUp className="w-4 h-4 text-accent-blue" />}
                  title="Plus de passes décisives"
                  name={topPerformers.assist?.name ?? '-'}
                  value={topPerformers.assist?.value ?? '0 passe'}
                  accentText="text-accent-blue"
                />
                <TopCard
                  icon={<Activity className="w-4 h-4 text-accent-green" />}
                  title="Plus de récupérations"
                  name={topPerformers.recov?.name ?? '-'}
                  value={topPerformers.recov?.value ?? '0 recup.'}
                  accentText="text-accent-green"
                />
              </div>
            )}
            {/* Filters */}
            <JoueursFilters
              search={search}
              onSearchChange={setSearch}
              positionFilter={positionFilter}
              onPositionChange={setPositionFilter}
              filteredCount={filtered.length}
            />
            {/* Table / Empty */}
            {filtered.length === 0 ? (
              <NoPlayersState
                hasFilters={!!(search || positionFilter)}
                onAdd={() => setIsModalOpen(true)}
              />
            ) : (
              <PlayerTable
                players={filtered}
                statsMap={statsMap}
                isLoadingStats={isLoadingStats}
                onView={setViewingPlayer}
                onEdit={setEditingPlayer}
                onDelete={setDeletingId}
              />
            )}
          </>
        )}
      </div>
      {/* Modals */}
      {activeTeam && (
        <CreatePlayerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateSuccess}
          teamId={activeTeam.id}
        />
      )}
      <PlayerDetailModal
        isOpen={!!viewingPlayer}
        player={viewingPlayer}
        stats={viewingPlayer ? statsMap[viewingPlayer.id] : undefined}
        onClose={() => setViewingPlayer(null)}
      />
      <EditPlayerModal
        isOpen={!!editingPlayer}
        player={editingPlayer}
        onClose={() => setEditingPlayer(null)}
        onSuccess={(updated) => {
          setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
          setEditingPlayer(null);
        }}
      />
      {deletingId && (
        <DeleteConfirmModal
          playerId={deletingId}
          onCancel={() => setDeletingId(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
