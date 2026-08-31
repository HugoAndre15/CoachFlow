'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { clubService, type Club } from '@/services/clubService';
import { teamService, type Team } from '@/services/teamService';

const ACTIVE_CLUB_KEY = 'activeClubId';
const ACTIVE_TEAM_KEY = 'activeTeamId';

interface ClubTeamContextType {
  activeClub: Club | null;
  allClubs: Club[];
  setActiveClub: (club: Club) => void;
  activeTeam: Team | null;
  allTeams: Team[];
  setActiveTeam: (team: Team) => void;
  isLoadingClubs: boolean;
  isLoadingTeams: boolean;
  clubsError: string | null;
  teamsError: string | null;
  refetchClubs: () => Promise<void>;
  refetchTeams: () => Promise<void>;
}

const ClubTeamContext = createContext<ClubTeamContextType | undefined>(undefined);

export function ClubTeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [activeClub, setActiveClubState] = useState<Club | null>(null);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [activeTeam, setActiveTeamState] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [clubsError, setClubsError] = useState<string | null>(null);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const fetchedUserId = useRef<string | null>(null);
  const activeClubIdRef = useRef<string | null>(null);
  const clubsRequestId = useRef(0);
  const teamsRequestId = useRef(0);

  const clearTeamState = useCallback((clearPersistedSelection: boolean) => {
    teamsRequestId.current += 1;
    setActiveTeamState(null);
    setAllTeams([]);
    setTeamsError(null);
    setIsLoadingTeams(false);
    if (clearPersistedSelection) {
      localStorage.removeItem(ACTIVE_TEAM_KEY);
    }
  }, []);

  const setActiveClub = useCallback((club: Club) => {
    const clubChanged = activeClubIdRef.current !== club.id;
    activeClubIdRef.current = club.id;
    setActiveClubState(club);
    localStorage.setItem(ACTIVE_CLUB_KEY, club.id);

    if (clubChanged) {
      clearTeamState(true);
    }
  }, [clearTeamState]);

  const setActiveTeam = useCallback((team: Team) => {
    if (activeClubIdRef.current && team.club_id !== activeClubIdRef.current) {
      return;
    }
    setActiveTeamState(team);
    localStorage.setItem(ACTIVE_TEAM_KEY, team.id);
  }, []);

  const refetchClubs = useCallback(async () => {
    if (!userId) return;

    const requestId = ++clubsRequestId.current;
    setIsLoadingClubs(true);
    setClubsError(null);

    try {
      const clubs = await clubService.getMyClubs();
      if (requestId !== clubsRequestId.current) return;

      setAllClubs(clubs);
      const savedId = localStorage.getItem(ACTIVE_CLUB_KEY);
      const resolved = clubs.find((club) => club.id === savedId) ?? clubs[0] ?? null;
      const previousClubId = activeClubIdRef.current;

      activeClubIdRef.current = resolved?.id ?? null;
      setActiveClubState(resolved);

      if (resolved) {
        localStorage.setItem(ACTIVE_CLUB_KEY, resolved.id);
      } else {
        localStorage.removeItem(ACTIVE_CLUB_KEY);
      }

      if (!resolved || (previousClubId !== null && previousClubId !== resolved.id)) {
        clearTeamState(true);
      }
    } catch (error) {
      if (requestId !== clubsRequestId.current) return;
      console.error('Error fetching clubs:', error);
      setClubsError('Impossible de charger les clubs.');
    } finally {
      if (requestId === clubsRequestId.current) {
        setIsLoadingClubs(false);
      }
    }
  }, [clearTeamState, userId]);

  const refetchTeams = useCallback(async () => {
    const clubId = activeClub?.id;
    if (!clubId) {
      clearTeamState(false);
      return;
    }

    const requestId = ++teamsRequestId.current;
    setIsLoadingTeams(true);
    setTeamsError(null);

    try {
      const teams = await teamService.getTeamsByClub(clubId);
      if (requestId !== teamsRequestId.current || activeClubIdRef.current !== clubId) return;

      setAllTeams(teams);
      const savedId = localStorage.getItem(ACTIVE_TEAM_KEY);
      const resolved = teams.find((team) => team.id === savedId) ?? teams[0] ?? null;
      setActiveTeamState(resolved);

      if (resolved) {
        localStorage.setItem(ACTIVE_TEAM_KEY, resolved.id);
      } else {
        localStorage.removeItem(ACTIVE_TEAM_KEY);
      }
    } catch (error) {
      if (requestId !== teamsRequestId.current) return;
      console.error('Error fetching teams:', error);
      setTeamsError('Impossible de charger les équipes.');
      setAllTeams([]);
      setActiveTeamState(null);
    } finally {
      if (requestId === teamsRequestId.current) {
        setIsLoadingTeams(false);
      }
    }
  }, [activeClub?.id, clearTeamState]);

  useEffect(() => {
    if (!userId) {
      clubsRequestId.current += 1;
      teamsRequestId.current += 1;
      fetchedUserId.current = null;
      activeClubIdRef.current = null;
      setActiveClubState(null);
      setAllClubs([]);
      setActiveTeamState(null);
      setAllTeams([]);
      setClubsError(null);
      setTeamsError(null);
      setIsLoadingClubs(false);
      setIsLoadingTeams(false);
      return;
    }

    if (fetchedUserId.current !== userId) {
      clubsRequestId.current += 1;
      teamsRequestId.current += 1;
      fetchedUserId.current = userId;
      activeClubIdRef.current = null;
      setActiveClubState(null);
      setAllClubs([]);
      setActiveTeamState(null);
      setAllTeams([]);
      setClubsError(null);
      setTeamsError(null);
      void refetchClubs();
    }
  }, [refetchClubs, userId]);

  useEffect(() => {
    if (activeClub?.id) {
      void refetchTeams();
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
        clubsError,
        teamsError,
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
