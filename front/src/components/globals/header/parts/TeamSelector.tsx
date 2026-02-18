'use client';

import { useState, useEffect, useRef } from "react";
import { teamService, Team } from "@/services/teamService";

interface TeamSelectorProps {
  clubId: string;
}

export default function TeamSelector({ clubId }: TeamSelectorProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamService.getTeamsByClub(clubId);
        setTeams(data);
        if (data.length > 0) {
          setSelectedTeam(data[0]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des équipes:', error);
      }
    };
    fetchTeams();
  }, [clubId]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (teams.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-neutral-lighter/50 dark:bg-dark-secondary border border-neutral/30 dark:border-dark-lighter hover:bg-neutral-lighter dark:hover:bg-dark-light transition-all duration-200 cursor-pointer shadow-sm"
      >
        {/* Icône équipe */}
        <div className="w-7 h-7 rounded-full bg-accent-green/15 dark:bg-accent-green/20 flex items-center justify-center border border-accent-green/25">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent-green">
            <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
          </svg>
        </div>
        <div className="text-left">
          <p className="text-[10px] text-grey-light dark:text-neutral/70 font-normal leading-none mb-0.5">Équipe sélectionnée</p>
          <p className="text-sm font-semibold text-dark dark:text-white leading-tight tracking-tight">{selectedTeam?.name}</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 ml-1 text-grey-light dark:text-neutral/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-full bg-neutral-lightest dark:bg-dark-secondary border border-neutral dark:border-dark-secondary rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-neutral/20 dark:border-dark-secondary">
            <p className="text-[10px] text-grey-light dark:text-neutral/70 font-medium uppercase tracking-wide">Mes équipes</p>
          </div>
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => {
                setSelectedTeam(team);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 cursor-pointer ${
                selectedTeam?.id === team.id
                  ? 'bg-accent-green/10 dark:bg-accent-green/15'
                  : 'hover:bg-neutral-lighter dark:hover:bg-dark-lighter'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                selectedTeam?.id === team.id 
                  ? 'bg-accent-green/20 border-accent-green/35' 
                  : 'bg-accent-green/10 dark:bg-accent-green/15 border-accent-green/25'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent-green">
                  <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
                </svg>
              </div>
              <span className={`text-sm font-semibold tracking-tight ${
                selectedTeam?.id === team.id
                  ? 'text-dark dark:text-white'
                  : 'text-dark-light dark:text-neutral-lighter'
              }`}>{team.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
