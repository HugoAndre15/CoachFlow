'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import { clubService, Club } from '@/services/clubService';
import { teamService, Team } from '@/services/teamService';

interface ClubTeamContextType {
  // Club
  activeClub: Club | null;
  allClubs: Club[];
  setActiveClub: (club: Club) => void;
  // Team
  activeTeam: Team | null;
  allTeams: Team[];
  setActiveTeam: (team: Team) => void;
  // Loading
  isLoadingClubs: boolean;
  isLoadingTeams: boolean;
  // Actions
  refetchClubs: () => Promise<void>;
  refetchTeams: () => Promise<void>;
}

const ClubTeamContext = createContext<ClubTeamContextType | undefined>(undefined);

export function ClubTeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Always initialize empty — hydrate from cache in useEffect to avoid SSR mismatch
  const [activeClub, setActiveClubState] = useState<Club | null>(null);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [activeTeam, setActiveTeamState] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  
  const hasFetchedClubs = useRef(false);
  const hasMounted = useRef(false);

  // Hydrate from localStorage cache after mount (avoids hydration mismatch)
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    try {
      const cachedClub = localStorage.getItem('cachedActiveClub');
      const cachedClubs = localStorage.getItem('cachedAllClubs');
      const cachedTeam = localStorage.getItem('cachedActiveTeam');
      const cachedTeams = localStorage.getItem('cachedAllTeams');
      if (cachedClub) setActiveClubState(JSON.parse(cachedClub));
      if (cachedClubs) setAllClubs(JSON.parse(cachedClubs));
      if (cachedTeam) setActiveTeamState(JSON.parse(cachedTeam));
      if (cachedTeams) setAllTeams(JSON.parse(cachedTeams));
    } catch { /* ignore parse errors */ }
  }, []);

  // Set active club and persist
  const setActiveClub = useCallback((club: Club) => {
    setActiveClubState(club);
    localStorage.setItem('activeClubId', club.id);
    localStorage.setItem('cachedActiveClub', JSON.stringify(club));
    // Reset team when club changes
    setActiveTeamState(null);
    localStorage.removeItem('activeTeamId');
    localStorage.removeItem('cachedActiveTeam');
    localStorage.removeItem('cachedAllTeams');
    // Dispatch event for any legacy listeners
    window.dispatchEvent(new CustomEvent('activeClubChanged', { detail: club }));
  }, []);

  // Set active team and persist
  const setActiveTeam = useCallback((team: Team) => {
    setActiveTeamState(team);
    localStorage.setItem('activeTeamId', team.id);
    localStorage.setItem('cachedActiveTeam', JSON.stringify(team));
    window.dispatchEvent(new CustomEvent('activeTeamChanged', { detail: team }));
  }, []);

  // Fetch clubs
  const refetchClubs = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingClubs(true);
      const clubs = await clubService.getMyClubs();
      setAllClubs(clubs);
      localStorage.setItem('cachedAllClubs', JSON.stringify(clubs));
      
      // Resolve active club
      const savedId = localStorage.getItem('activeClubId');
      let active = savedId ? clubs.find(c => c.id === savedId) : undefined;
      const resolved = active || clubs[0] || null;
      
      if (resolved) {
        setActiveClubState(resolved);
        localStorage.setItem('activeClubId', resolved.id);
        localStorage.setItem('cachedActiveClub', JSON.stringify(resolved));
      } else {
        setActiveClubState(null);
      }
    } catch (err) {
      console.error('Error fetching clubs:', err);
    } finally {
      setIsLoadingClubs(false);
    }
  }, [user]);

  // Fetch teams for active club
  const refetchTeams = useCallback(async () => {
    if (!activeClub) {
      setAllTeams([]);
      setActiveTeamState(null);
      return;
    }
    try {
      setIsLoadingTeams(true);
      const teams = await teamService.getTeamsByClub(activeClub.id);
      setAllTeams(teams);
      localStorage.setItem('cachedAllTeams', JSON.stringify(teams));

      // Resolve active team
      const savedId = localStorage.getItem('activeTeamId');
      let active = savedId ? teams.find(t => t.id === savedId) : undefined;
      const resolved = active || teams[0] || null;
      
      if (resolved) {
        setActiveTeamState(resolved);
        localStorage.setItem('activeTeamId', resolved.id);
        localStorage.setItem('cachedActiveTeam', JSON.stringify(resolved));
      } else {
        setActiveTeamState(null);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setIsLoadingTeams(false);
    }
  }, [activeClub]);

  // Fetch clubs on mount (once) when user is available
  useEffect(() => {
    if (user && !hasFetchedClubs.current) {
      hasFetchedClubs.current = true;
      refetchClubs();
    }
    if (!user) {
      hasFetchedClubs.current = false;
      setActiveClubState(null);
      setAllClubs([]);
      setActiveTeamState(null);
      setAllTeams([]);
    }
  }, [user, refetchClubs]);

  // Fetch teams when active club changes
  useEffect(() => {
    if (activeClub) {
      refetchTeams();
    }
  }, [activeClub?.id, refetchTeams]);

  return (
    <ClubTeamContext.Provider
      value={{
        activeClub,
        allClubs,
        setActiveClub,
        activeTeam,
        allTeams,
        setActiveTeam,
        isLoadingClubs,
        isLoadingTeams,
        refetchClubs,
        refetchTeams,
      }}
    >
      {children}
    </ClubTeamContext.Provider>
  );
}

export function useClubTeam() {
  const context = useContext(ClubTeamContext);
  if (context === undefined) {
    throw new Error('useClubTeam must be used within a ClubTeamProvider');
  }
  return context;
}
