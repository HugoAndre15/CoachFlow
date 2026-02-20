'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Target, Award, AlertTriangle } from 'lucide-react';
import { playerService, Player, PlayerStats } from '@/services/playerService';
import { Team } from '@/services/teamService';
import CreatePlayerModal from '../parts/CreatePlayerModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

const POSITION_LABELS: Record<string, { label: string; color: string }> = {
  GOALKEEPER: { label: 'G', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  DEFENDER:   { label: 'D', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  MIDFIELDER: { label: 'M', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  FORWARD:    { label: 'A', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const POSITION_FULL: Record<string, string> = {
  GOALKEEPER: 'Gardien',
  DEFENDER: 'Défenseur',
  MIDFIELDER: 'Milieu',
  FORWARD: 'Attaquant',
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    'bg-accent-green/10 text-accent-green',
  INJURED:   'bg-accent-red/10 text-accent-red',
  SUSPENDED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  RETIRED:   'bg-neutral/20 text-dark-light dark:text-neutral',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actif',
  INJURED: 'Blessé',
  SUSPENDED: 'Suspendu',
  RETIRED: 'Retraité',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function JoueursPage() {
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, PlayerStats>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Charger depuis localStorage au montage
  useEffect(() => {
    const savedTeamId = localStorage.getItem('activeTeamId');
    const savedTeamName = localStorage.getItem('activeTeamName');
    const savedTeamCategory = localStorage.getItem('activeTeamCategory');
    if (savedTeamId && savedTeamName) {
      const team: Team = {
        id: savedTeamId,
        name: savedTeamName,
        category: savedTeamCategory || '',
        club_id: '',
      };
      setActiveTeam(team);
    }
  }, []);

  // Écouter les changements d'équipe
  useEffect(() => {
    const handler = (e: CustomEvent<Team>) => {
      setActiveTeam(e.detail);
      localStorage.setItem('activeTeamName', e.detail.name);
      localStorage.setItem('activeTeamCategory', e.detail.category);
    };
    window.addEventListener('activeTeamChanged', handler as EventListener);
    return () => window.removeEventListener('activeTeamChanged', handler as EventListener);
  }, []);

  // Charger les joueurs quand l'équipe change
  const fetchPlayers = useCallback(async (teamId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setStatsMap({});
      const data = await playerService.getPlayersByTeam(teamId);
      setPlayers(data);
      // Charger les stats de tous les joueurs en parallèle
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
  const filtered = players.filter(p => {
    if (positionFilter && p.position !== positionFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    if (activeTeam?.id) fetchPlayers(activeTeam.id);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Joueurs</h1>
          {activeTeam && (
            <p className="text-sm text-dark-light/70 dark:text-neutral mt-0.5">
              {activeTeam.name}
              {activeTeam.category && <span className="ml-2 text-xs bg-neutral-lighter dark:bg-dark-light px-1.5 py-0.5 rounded">{activeTeam.category}</span>}
            </p>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!activeTeam}
          className="flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-lg text-sm font-medium hover:bg-accent-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Ajouter un joueur
        </button>
      </div>

      {/* No team selected */}
      {!activeTeam ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <Users className="w-12 h-12 text-neutral mb-4" />
          <p className="text-dark-light dark:text-neutral font-medium">Aucune équipe sélectionnée</p>
          <p className="text-sm text-dark-light/50 dark:text-neutral/50 mt-1">
            Sélectionnez une équipe dans la barre de navigation
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-accent-red font-medium">{error}</p>
          <button onClick={() => fetchPlayers(activeTeam.id)} className="mt-3 text-sm text-accent-green hover:underline">
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* Filtres + compteur */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-dark-light dark:text-neutral">
              <span className="font-semibold text-dark dark:text-white">{filtered.length}</span> joueur{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <select
                value={positionFilter}
                onChange={e => setPositionFilter(e.target.value)}
                className="text-sm bg-white dark:bg-dark-lighter border border-neutral/30 dark:border-dark-light text-dark dark:text-white rounded-lg px-3 py-1.5 outline-none focus:border-accent-green"
              >
                <option value="">Tous les postes</option>
                <option value="GOALKEEPER">Gardiens</option>
                <option value="DEFENDER">Défenseurs</option>
                <option value="MIDFIELDER">Milieux</option>
                <option value="FORWARD">Attaquants</option>
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-sm bg-white dark:bg-dark-lighter border border-neutral/30 dark:border-dark-light text-dark dark:text-white rounded-lg px-3 py-1.5 outline-none focus:border-accent-green"
              >
                <option value="">Tous les statuts</option>
                <option value="ACTIVE">Actifs</option>
                <option value="INJURED">Blessés</option>
                <option value="SUSPENDED">Suspendus</option>
                <option value="RETIRED">Retraités</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-10 h-10 text-neutral mb-3" />
              <p className="text-dark-light dark:text-neutral font-medium">Aucun joueur</p>
              <p className="text-sm text-dark-light/50 dark:text-neutral/50 mt-1 mb-4">
                {positionFilter || statusFilter ? 'Aucun joueur ne correspond aux filtres' : 'Ajoutez votre premier joueur'}
              </p>
              {!positionFilter && !statusFilter && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-lg text-sm font-medium hover:bg-accent-green/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un joueur
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-xl overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[40px_1fr_120px_100px_40px_40px_40px_40px_40px] gap-3 px-4 py-2.5 border-b border-neutral/10 dark:border-dark-light bg-neutral-lighter/40 dark:bg-dark-secondary/30">
                <span className="text-xs font-medium text-dark-light/60 dark:text-neutral/60 text-center">#</span>
                <span className="text-xs font-medium text-dark-light/60 dark:text-neutral/60">Joueur</span>
                <span className="text-xs font-medium text-dark-light/60 dark:text-neutral/60">Poste</span>
                <span className="text-xs font-medium text-dark-light/60 dark:text-neutral/60">Statut</span>
                <span className="text-xs font-medium text-dark-light/60 dark:text-neutral/60 text-center" title="Matchs joués">MJ</span>
                <span className="text-xs font-medium text-dark-light/60 dark:text-neutral/60 text-center" title="Buts">
                  <Target className="w-3.5 h-3.5 inline" />
                </span>
                <span className="text-xs font-medium text-dark-light/60 dark:text-neutral/60 text-center" title="Passes décisives">
                  <Award className="w-3.5 h-3.5 inline" />
                </span>
                <span className="text-xs font-medium text-yellow-500 text-center" title="Cartons jaunes">▪</span>
                <span className="text-xs font-medium text-red-500 text-center" title="Cartons rouges">▪</span>
              </div>

              {/* Player rows */}
              {filtered.map(player => {
                const stats = statsMap[player.id];
                const posStyle = player.position ? POSITION_LABELS[player.position] : null;
                return (
                  <div
                    key={player.id}
                    className="grid grid-cols-[40px_1fr_120px_100px_40px_40px_40px_40px_40px] gap-3 px-4 py-3 border-b border-neutral/5 dark:border-dark-light/50 last:border-0 hover:bg-neutral-lighter/30 dark:hover:bg-dark-secondary/20 transition-colors items-center"
                  >
                    {/* Numéro */}
                    <span className="text-sm font-bold text-dark-light dark:text-neutral text-center">
                      {player.jersey_number ?? '—'}
                    </span>

                    {/* Nom */}
                    <div>
                      <p className="text-sm font-semibold text-dark dark:text-white">
                        {player.last_name} {player.first_name}
                      </p>
                      {player.strong_foot && (
                        <p className="text-[10px] text-dark-light/50 dark:text-neutral/50">
                          Pied {player.strong_foot === 'RIGHT' ? 'D' : player.strong_foot === 'LEFT' ? 'G' : 'D/G'}
                        </p>
                      )}
                    </div>

                    {/* Poste */}
                    <div className="flex items-center gap-1.5">
                      {posStyle && (
                        <span className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${posStyle.color}`}>
                          {posStyle.label}
                        </span>
                      )}
                      <span className="text-xs text-dark-light/70 dark:text-neutral">
                        {player.position ? POSITION_FULL[player.position] : '—'}
                      </span>
                    </div>

                    {/* Statut */}
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full w-fit ${STATUS_STYLE[player.status]}`}>
                      {STATUS_LABEL[player.status]}
                    </span>

                    {/* Stats */}
                    {isLoadingStats && !stats ? (
                      <div className="col-span-5 flex items-center justify-center">
                        <div className="h-3 w-16 bg-neutral/20 rounded animate-pulse" />
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-dark dark:text-neutral-lighter text-center font-medium">
                          {stats?.total_matches ?? '—'}
                        </span>
                        <span className="text-sm text-dark dark:text-neutral-lighter text-center font-medium">
                          {stats?.goals ?? '—'}
                        </span>
                        <span className="text-sm text-dark dark:text-neutral-lighter text-center font-medium">
                          {stats?.assists ?? '—'}
                        </span>
                        <span className="text-sm text-yellow-500 text-center font-medium">
                          {stats?.yellow_cards ?? '—'}
                        </span>
                        <span className="text-sm text-red-500 text-center font-medium">
                          {stats?.red_cards ?? '—'}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {activeTeam && (
        <CreatePlayerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateSuccess}
          teamId={activeTeam.id}
        />
      )}
    </div>
  );
}
