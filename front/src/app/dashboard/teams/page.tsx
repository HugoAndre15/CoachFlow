'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Shield, ChevronRight } from 'lucide-react';
import { teamService, Team } from '@/services/teamService';
import { clubService } from '@/services/clubService';
import CreateTeamModal from '../parts/CreateTeamModal';

interface Club {
  id: string;
  name: string;
  role: string;
}

const mapRole = (role?: string): string => {
  switch (role) {
    case 'COACH': return 'Coach';
    case 'ASSISTANT_COACH': return 'Coach assistant';
    default: return role || 'Membre';
  }
};

const CATEGORIES = [
  'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15',
  'U16', 'U17', 'U18', 'U19', 'U20', 'U21', 'Séniors', 'Vétérans', 'Féminine',
];

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [activeClub, setActiveClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Charger les clubs de l'utilisateur
  const fetchClubs = async () => {
    try {
      const data = await clubService.getMyClubs();
      setClubs(data);

      // Récupérer le club actif depuis localStorage
      const savedId = localStorage.getItem('activeClubId');
      const found = savedId ? data.find(c => c.id === savedId) : null;
      setActiveClub(found || data[0] || null);
    } catch (err) {
      console.error('Error fetching clubs:', err);
    }
  };

  // Charger les équipes du club actif
  const fetchTeams = async (clubId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await teamService.getTeamsByClub(clubId);
      setTeams(data);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
      setError(err.message || 'Erreur lors du chargement des équipes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (activeClub) {
      fetchTeams(activeClub.id);
    } else {
      setIsLoading(false);
    }
  }, [activeClub]);

  // Écouter les changements de club depuis le UserMenu
  useEffect(() => {
    const handleClubChange = (e: CustomEvent) => {
      setActiveClub(e.detail);
    };
    window.addEventListener('activeClubChanged', handleClubChange as EventListener);
    return () => window.removeEventListener('activeClubChanged', handleClubChange as EventListener);
  }, []);

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    if (activeClub) fetchTeams(activeClub.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">Mes Équipes</h1>
          {activeClub && (
            <p className="text-sm text-dark-light/70 dark:text-neutral mt-0.5">
              {activeClub.name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sélecteur de club */}
          {clubs.length > 1 && (
            <select
              value={activeClub?.id || ''}
              onChange={(e) => {
                const club = clubs.find(c => c.id === e.target.value);
                if (club) {
                  setActiveClub(club);
                  localStorage.setItem('activeClubId', club.id);
                }
              }}
              className="text-sm bg-white dark:bg-dark-lighter border border-neutral/30 dark:border-dark-light text-dark dark:text-white rounded-lg px-3 py-2 outline-none focus:border-accent-green"
            >
              {clubs.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!activeClub}
            className="flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-lg text-sm font-medium hover:bg-accent-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Nouvelle équipe
          </button>
        </div>
      </div>

      {/* Contenu */}
      {!activeClub ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Shield className="w-12 h-12 text-neutral mb-4" />
          <p className="text-dark-light dark:text-neutral font-medium">Aucun club sélectionné</p>
          <p className="text-sm text-dark-light/50 dark:text-neutral/50 mt-1">
            Rejoignez ou créez un club pour gérer vos équipes
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-lighter rounded-xl p-5 border border-neutral/20 dark:border-dark-light animate-pulse">
              <div className="h-4 bg-neutral/20 dark:bg-dark-light rounded w-2/3 mb-3" />
              <div className="h-3 bg-neutral/10 dark:bg-dark-light/50 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-accent-red font-medium">{error}</p>
          <button
            onClick={() => fetchTeams(activeClub.id)}
            className="mt-3 text-sm text-accent-green hover:underline"
          >
            Réessayer
          </button>
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users className="w-12 h-12 text-neutral mb-4" />
          <p className="text-dark-light dark:text-neutral font-medium">Aucune équipe</p>
          <p className="text-sm text-dark-light/50 dark:text-neutral/50 mt-1 mb-4">
            Créez votre première équipe pour ce club
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-lg text-sm font-medium hover:bg-accent-green/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer une équipe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="group bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-xl p-5 hover:border-accent-green/40 dark:hover:border-accent-green/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent-green/10 dark:bg-accent-green/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent-green" />
                </div>
                {team.myRole && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-lighter dark:bg-dark-light text-dark-light dark:text-neutral">
                    {mapRole(team.myRole)}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-dark dark:text-white text-base leading-tight">
                {team.name}
              </h3>
              <p className="text-sm text-dark-light/70 dark:text-neutral mt-0.5">
                {team.category}
              </p>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral/10 dark:border-dark-light">
                {team._count && (
                  <>
                    <span className="flex items-center gap-1 text-xs text-dark-light/70 dark:text-neutral">
                      <Users className="w-3.5 h-3.5" />
                      {team._count.players} joueur{team._count.players !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-dark-light/70 dark:text-neutral">
                      <Shield className="w-3.5 h-3.5" />
                      {team._count.teamUsers} staff
                    </span>
                  </>
                )}
                <button className="ml-auto flex items-center gap-1 text-xs text-accent-green opacity-0 group-hover:opacity-100 transition-opacity">
                  Voir
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      {activeClub && (
        <CreateTeamModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateSuccess}
          clubId={activeClub.id}
        />
      )}
    </div>
  );
}
