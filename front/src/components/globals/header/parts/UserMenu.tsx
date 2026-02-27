'use client';

import { useState, useRef, useEffect } from "react";
import { clubService } from '@/services/clubService';
import { teamService, Team } from '@/services/teamService';
import CreateClubModal from '@/app/dashboard/clubs/parts/CreateClubModal';
import { Users, Settings, LogOut, Plus, LayoutGrid, RefreshCcw, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ClubLogo from '@/components/ui/ClubLogo';

interface Club {
  id: string;
  name: string;
  logo?: string;
  role: string;
  created_at: string;
}

interface UserMenuProps {
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  onLogout: () => void;
}

// Mapper les rôles de la BDD vers l'affichage
const mapRole = (role: string): string => {
  switch (role) {
    case 'PRESIDENT':
      return 'Président';
    case 'RESPONSABLE':
      return 'Responsable';
    case 'COACH':
      return 'Entraîneur';
    default:
      return role;
  }
};

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showClubsPopup, setShowClubsPopup] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [activeClub, setActiveClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const clubsPopupRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Récupérer les clubs
  const fetchClubs = async () => {
    try {
      setIsLoadingClubs(true);
      const data = await clubService.getMyClubs();
      setClubs(data);
      
      // Récupérer le club actif depuis le localStorage
      const savedActiveClubId = localStorage.getItem('activeClubId');
      let active: Club | undefined;
      if (savedActiveClubId) {
        active = data.find(c => c.id === savedActiveClubId);
      }
      const resolvedClub = active || data[0] || null;
      setActiveClub(resolvedClub);
      if (resolvedClub) {
        fetchTeams(resolvedClub.id);
      }
      if (!savedActiveClubId && data.length > 0) {
        localStorage.setItem('activeClubId', data[0].id);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setIsLoadingClubs(false);
    }
  };

  const fetchTeams = async (clubId: string) => {
    try {
      const data = await teamService.getTeamsByClub(clubId);
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clubsPopupRef.current && !clubsPopupRef.current.contains(e.target as Node)) {
        setShowClubsPopup(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClubChange = (club: Club) => {
    setActiveClub(club);
    localStorage.setItem('activeClubId', club.id);
    fetchTeams(club.id);
    setShowClubsPopup(false);
    setIsOpen(false);
    // Rafraîchir la page ou émettre un événement pour mettre à jour l'app
    window.dispatchEvent(new CustomEvent('activeClubChanged', { detail: club }));
  };

  const handleCreateClubSuccess = () => {
    setIsModalOpen(false);
    fetchClubs(); // Rafraîchir la liste des clubs
    setShowClubsPopup(false);
    setIsOpen(false);
  };

  const otherClubs = clubs.filter(c => c.id !== activeClub?.id);

  const handleOpenClubsPopup = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowClubsPopup(true);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 cursor-pointer transition-opacity hover:bg-neutral-lighter/50 dark:hover:bg-dark-secondary rounded-lg px-2 py-1 transition-all duration-200"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-dark dark:text-white leading-tight">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-[10px] text-dark-light/70 dark:text-neutral leading-none">
              {activeClub ? mapRole(activeClub.role) : 'Aucun club'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-neutral-lighter dark:bg-dark-light border-2 border-neutral/30 dark:border-dark-light hover:border-accent-green dark:hover:border-accent-green transition-colors flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-dark-light dark:text-neutral">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* En-tête utilisateur */}
            <div className="px-4 py-3 border-b border-neutral/20 dark:border-dark-light">
              <p className="text-xs text-dark-light/70 dark:text-neutral uppercase tracking-wider mb-1">
                Compte
              </p>
              <p className="text-sm font-semibold text-dark dark:text-white">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-dark-light/70 dark:text-neutral truncate">{user.email}</p>
            </div>

            {/* Club actif */}
            {activeClub && (
              <div className="px-4 py-3 bg-accent-green/5 dark:bg-accent-green/10 border-b border-neutral/20 dark:border-dark-light">
                <div className="flex items-center gap-2">
                  <ClubLogo logo={activeClub.logo} name={activeClub.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark dark:text-white truncate">
                      {activeClub.name}
                    </p>
                  </div>
                  <button
                    onClick={handleOpenClubsPopup}
                    className="p-1.5 hover:bg-white/50 dark:hover:bg-dark-light rounded transition-colors"
                    title="Changer de club"
                  >
                    <RefreshCcw className="w-4 h-4 text-dark-light dark:text-neutral" />
                  </button>
                </div>
              </div>
            )}

            {/* Mes équipes */}
            {teams.length > 0 && (
              <div className="px-4 py-3 border-b border-neutral/20 dark:border-dark-light">
                <p className="text-xs text-dark-light/70 dark:text-neutral uppercase tracking-wider mb-2">
                  Mes équipes
                </p>
                <div className="space-y-1">
                  {teams.slice(0, 3).map(team => (
                    <button
                      key={team.id}
                      onClick={() => {
                        router.push('/dashboard/teams');
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 py-1.5 text-sm text-dark dark:text-neutral-lightest hover:text-accent-green dark:hover:text-accent-green transition-colors text-left"
                    >
                      <Shield className="w-3.5 h-3.5 text-accent-green/70 flex-shrink-0" />
                      <span className="truncate">{team.name}</span>
                      <span className="ml-auto text-xs text-dark-light/50 dark:text-neutral/50 flex-shrink-0">{team.category}</span>
                    </button>
                  ))}
                  {teams.length > 3 && (
                    <p className="text-xs text-dark-light/50 dark:text-neutral/50 pl-5">
                      +{teams.length - 3} autre{teams.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    router.push('/dashboard/teams');
                    setIsOpen(false);
                  }}
                  className="mt-2 text-xs text-accent-green hover:underline"
                >
                  Gérer mes équipes →
                </button>
              </div>
            )}

            {/* Liens du menu */}
            <div className="py-1">
              <button
                onClick={() => {
                  router.push('/dashboard/mon-compte');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-light dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-light/50 hover:text-dark dark:hover:text-white transition-colors"
              >
                <Users className="w-4 h-4" />
                Mon Compte
              </button>
              <button
                onClick={() => {
                  router.push('/dashboard/parametres');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-light dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-light/50 hover:text-dark dark:hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                Paramètres
              </button>
            </div>

            {/* Déconnexion */}
            <div className="border-t border-neutral/20 dark:border-dark-light py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accent-red hover:bg-accent-red/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Popup de changement de club */}
      {showClubsPopup && (
        <div 
          ref={clubsPopupRef}
          className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-dark-lighter border border-neutral/20 dark:border-dark-light rounded-xl shadow-xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ marginTop: '0.5rem' }}
        >
          <div className="px-4 py-3 border-b border-neutral/20 dark:border-dark-light">
            <p className="text-sm font-semibold text-dark dark:text-white">
              Changer de Club
            </p>
          </div>

          {/* Liste des autres clubs */}
          {otherClubs.length > 0 && (
            <div className="py-2 border-b border-neutral/20 dark:border-dark-light max-h-64 overflow-y-auto">
              {otherClubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => handleClubChange(club)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-lighter/50 dark:hover:bg-dark-light/50 transition-colors text-left"
                >
                  <ClubLogo logo={club.logo} name={club.name} size="md" />
                  <span className="text-sm text-dark dark:text-neutral-lightest truncate flex-1">
                    {club.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => {
                router.push('/dashboard/clubs');
                setShowClubsPopup(false);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-light dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-light/50 hover:text-dark dark:hover:text-white transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              Gérer mes clubs
            </button>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setShowClubsPopup(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-light dark:text-neutral-lighter hover:bg-neutral-lighter/50 dark:hover:bg-dark-light/50 hover:text-dark dark:hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer un Club
            </button>
          </div>
        </div>
      )}

      {/* Modal de création de club */}
      <CreateClubModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateClubSuccess}
      />
    </>
  );
} 