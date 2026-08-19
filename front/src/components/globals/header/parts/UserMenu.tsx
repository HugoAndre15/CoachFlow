'use client';

import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, LogOut, Shield, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClubTeam } from '@/contexts/ClubTeamContext';

interface UserMenuProps {
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  onLogout: () => void;
}

const mapRole = (role?: string): string => {
  switch (role) {
    case 'PRESIDENT': return 'Président';
    case 'RESPONSABLE': return 'Responsable';
    case 'COACH': return 'Entraîneur';
    case 'ASSISTANT_COACH': return 'Coach assistant';
    default: return 'Aucun club';
  }
};

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const { activeClub, activeTeam } = useClubTeam();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-neutral-lighter/50 dark:hover:bg-dark-secondary"
        aria-expanded={isOpen}
        aria-label="Ouvrir le menu utilisateur"
      >
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-dark dark:text-white">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-[10px] leading-none text-dark-light/70 dark:text-neutral">
            {mapRole(activeClub?.role)}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-neutral/30 bg-neutral-lighter text-sm font-bold text-dark-light transition-colors hover:border-accent-green dark:border-dark-light dark:bg-dark-light dark:text-neutral">
          {user.first_name.charAt(0).toUpperCase()}{user.last_name.charAt(0).toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-neutral/20 bg-white shadow-xl dark:border-dark-light dark:bg-dark-lighter">
          <div className="border-b border-neutral/20 px-4 py-3 dark:border-dark-light">
            <p className="text-sm font-semibold text-dark dark:text-white">
              {user.first_name} {user.last_name}
            </p>
            <p className="truncate text-xs text-dark-light/70 dark:text-neutral">{user.email}</p>
          </div>

          {(activeClub || activeTeam) && (
            <div className="space-y-1 border-b border-neutral/20 bg-accent-green/5 px-4 py-3 text-xs dark:border-dark-light dark:bg-accent-green/10">
              {activeClub && (
                <p className="flex items-center gap-2 text-dark dark:text-neutral-lightest">
                  <Shield className="h-3.5 w-3.5 text-accent-green" />
                  <span className="truncate">{activeClub.name}</span>
                </p>
              )}
              {activeTeam && (
                <p className="flex items-center gap-2 text-dark-light dark:text-neutral">
                  <Users className="h-3.5 w-3.5 text-accent-blue" />
                  <span className="truncate">{activeTeam.name}</span>
                </p>
              )}
            </div>
          )}

          <div className="py-1">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-dark-light transition-colors hover:bg-neutral-lighter/50 hover:text-dark dark:text-neutral-lighter dark:hover:bg-dark-light/50 dark:hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              Tableau de bord
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/clubs')}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-dark-light transition-colors hover:bg-neutral-lighter/50 hover:text-dark dark:text-neutral-lighter dark:hover:bg-dark-light/50 dark:hover:text-white"
            >
              <Shield className="h-4 w-4" />
              Mes clubs
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/teams')}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-dark-light transition-colors hover:bg-neutral-lighter/50 hover:text-dark dark:text-neutral-lighter dark:hover:bg-dark-light/50 dark:hover:text-white"
            >
              <Users className="h-4 w-4" />
              Mes équipes
            </button>
          </div>

          <div className="border-t border-neutral/20 py-1 dark:border-dark-light">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-accent-red transition-colors hover:bg-accent-red/10"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
