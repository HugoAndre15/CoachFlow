'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useClubTeam } from '@/contexts/ClubTeamContext';
import { 
  ChevronDown, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronRight,
  Shield,
  Menu,
} from 'lucide-react';

// Map roles to French display
const mapRole = (role: string): string => {
  switch (role) {
    case 'PRESIDENT': return 'Président';
    case 'RESPONSABLE': return 'Responsable';
    case 'COACH': return 'Entraîneur';
    default: return role;
  }
};

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export default function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const {
    activeClub,
    allClubs,
    setActiveClub,
    activeTeam,
    allTeams,
    setActiveTeam,
  } = useClubTeam();
  const router = useRouter();

  const [clubOpen, setClubOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const clubRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clubRef.current && !clubRef.current.contains(e.target as Node)) setClubOpen(false);
      if (teamRef.current && !teamRef.current.contains(e.target as Node)) setTeamOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 h-14 bg-dark border-b border-dark-light/50 flex items-center px-2 sm:px-4 lg:px-6 select-none">
      {/* Mobile hamburger */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 -ml-1 mr-2 rounded-lg text-grey-medium hover:text-white hover:bg-dark-lighter transition-colors"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo - Left (hidden on mobile to save space) */}
      <a href="/" className="hidden md:flex items-center gap-2.5 mr-8 flex-shrink-0 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-accent-green flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
            <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
          </svg>
        </div>
        <span className="text-lg font-bold text-white hidden lg:block">CoachFlow</span>
      </a>

      {/* Center - Club & Team Selectors */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-center min-w-0">
        {/* Club Selector */}
        <div className="relative" ref={clubRef}>
          <button
            onClick={() => { setClubOpen(!clubOpen); setTeamOpen(false); }}
            className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 rounded-lg hover:bg-dark-lighter transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-[10px] text-grey-medium uppercase tracking-wider font-medium hidden lg:block">Club</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-6 h-6 rounded-md bg-accent-green/20 flex items-center justify-center border border-accent-green/30 flex-shrink-0">
                  <Shield className="w-3.5 h-3.5 text-accent-green" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white max-w-[80px] sm:max-w-[140px] truncate">
                  {activeClub?.name || 'Aucun club'}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-grey-medium transition-transform duration-200 flex-shrink-0 ${clubOpen ? 'rotate-180' : ''}`} />
          </button>

          {clubOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-64 bg-dark-lighter border border-dark-light/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto">
                {allClubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => {
                      setActiveClub(club);
                      setClubOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      activeClub?.id === club.id
                        ? 'bg-accent-green/15 text-white'
                        : 'text-neutral hover:bg-dark-light/50 hover:text-white'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                      activeClub?.id === club.id
                        ? 'bg-accent-green text-white'
                        : 'bg-dark-light text-neutral'
                    }`}>
                      {club.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate">{club.name}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-dark-light/50 p-2">
                <button
                  onClick={() => {
                    router.push('/dashboard/clubs');
                    setClubOpen(false);
                  }}
                  className="w-full text-xs text-accent-green hover:text-accent-green/80 py-1.5 text-center font-medium transition-colors"
                >
                  Gérer mes Clubs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-dark-light flex-shrink-0" />

        {/* Team Selector */}
        <div className="relative" ref={teamRef}>
          <button
            onClick={() => { setTeamOpen(!teamOpen); setClubOpen(false); }}
            className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 rounded-lg hover:bg-dark-lighter transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-[10px] text-grey-medium uppercase tracking-wider font-medium hidden lg:block">Équipe</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-6 h-6 rounded-md bg-accent-blue/20 flex items-center justify-center border border-accent-blue/30 flex-shrink-0">
                  <Shield className="w-3.5 h-3.5 text-accent-blue" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white max-w-[80px] sm:max-w-[140px] truncate">
                  {activeTeam?.name || 'Aucune équipe'}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-grey-medium transition-transform duration-200 flex-shrink-0 ${teamOpen ? 'rotate-180' : ''}`} />
          </button>

          {teamOpen && (
            <div className="absolute top-full mt-2 right-0 sm:left-0 sm:right-auto w-64 bg-dark-lighter border border-dark-light/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto">
                {allTeams.length === 0 ? (
                  <p className="text-xs text-grey-medium text-center py-4">Aucune équipe disponible</p>
                ) : (
                  allTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setActiveTeam(team);
                        setTeamOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        activeTeam?.id === team.id
                          ? 'bg-accent-blue/15 text-white'
                          : 'text-neutral hover:bg-dark-light/50 hover:text-white'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                        activeTeam?.id === team.id
                          ? 'bg-accent-blue text-white'
                          : 'bg-dark-light text-neutral'
                      }`}>
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{team.name}</span>
                        <span className="text-[10px] text-grey-medium">{team.category}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-dark-light/50 p-2">
                <button
                  onClick={() => {
                    router.push('/dashboard/teams');
                    setTeamOpen(false);
                  }}
                  className="w-full text-xs text-accent-green hover:text-accent-green/80 py-1.5 text-center font-medium transition-colors"
                >
                  Gérer mes Équipes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right - Notifications + Profile */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Notifications — desktop only */}
        <button className="relative p-2 rounded-lg hover:bg-dark-lighter transition-colors text-grey-medium hover:text-white hidden sm:block">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full" />
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-lg hover:bg-dark-lighter transition-colors cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white leading-tight">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-[10px] text-grey-medium leading-none">
                {activeClub ? mapRole(activeClub.role) : ''}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-dark-light border-2 border-dark-light hover:border-accent-green transition-colors flex items-center justify-center">
              <User className="w-4 h-4 text-neutral" />
            </div>
          </button>

          {profileOpen && (
            <div className="absolute top-full mt-2 right-0 w-56 bg-dark-lighter border border-dark-light/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User info */}
              <div className="px-4 py-3 border-b border-dark-light/50">
                <p className="text-sm font-semibold text-white">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-grey-medium truncate">{user.email}</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                {/* Notifications — mobile only, inside profile dropdown */}
                <button
                  onClick={() => {
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral hover:bg-dark-light/50 hover:text-white transition-colors sm:hidden"
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                  <span className="ml-auto w-2 h-2 bg-accent-red rounded-full" />
                </button>
                <button
                  onClick={() => {
                    router.push('/dashboard/mon-compte');
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral hover:bg-dark-light/50 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4" />
                  Mon Compte
                </button>
                <button
                  onClick={() => {
                    router.push('/dashboard/parametres');
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral hover:bg-dark-light/50 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Paramètres
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-dark-light/50 py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
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
      </div>
    </header>
  );
}
