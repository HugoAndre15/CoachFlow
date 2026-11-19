"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import RosterDialog from "@/app/dashboard/joueurs/parts/RosterDialog";
import { useClubTeam } from "@/contexts/ClubTeamContext";
import type { Club } from "@/services/clubService";
import { teamService, type Team } from "@/services/teamService";

function OtherClub({ club, choose }: { club: Club; choose: (club: Club, team?: Team) => void }) {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setFailed(false);
    teamService.getTeamsByClub(club.id).then(items => {
      if (current) setTeams(items);
    }).catch(() => { if (current) setFailed(true); });
    return () => { current = false; };
  }, [club.id, attempt]);

  if (failed) return <button type="button" className="picker-row" onClick={() => setAttempt(attempt + 1)}>Réessayer de charger les équipes</button>;
  if (!teams) return <p className="picker-note" role="status">Chargement des équipes…</p>;
  if (!teams.length) return <button type="button" className="picker-row" onClick={() => choose(club)}>Ouvrir ce club sans équipe</button>;
  return teams.map(team => <TeamRow key={team.id} team={team} selected={false} onClick={() => choose(club, team)} />);
}

function TeamRow({ team, selected, onClick }: { team: Team; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className="picker-row" aria-pressed={selected} onClick={onClick}>
      <span>{team.name}{team.category && team.category !== team.name && <small>{team.category}</small>}</span>
      {selected && <Check size={18} aria-hidden="true" />}
    </button>
  );
}

export default function TeamPicker({ onClose }: { onClose: () => void }) {
  const { activeClub, activeTeam, allClubs, allTeams, setActiveClub, setActiveTeam,
    teamsError, isLoadingTeams, refetchTeams } = useClubTeam();
  const pathname = usePathname();
  const router = useRouter();

  function choose(club: Club, team?: Team) {
    const changed = activeClub?.id !== club.id || (team && activeTeam?.id !== team.id);
    if (changed) {
      if (!window.dispatchEvent(new Event("coachflow:before-team-change", { cancelable: true }))) return;
      if (activeClub?.id !== club.id) setActiveClub(club);
      if (team) setActiveTeam(team);
      if (pathname.startsWith("/dashboard/matchs/") || pathname === "/dashboard/direct") {
        router.replace("/dashboard/matchs");
      }
    }
    onClose();
  }

  return (
    <RosterDialog title="Changer d’équipe" onClose={onClose}>
      {allClubs.map(club => (
        <section key={club.id} aria-label={club.name} className="picker-group">
          <h3>{club.name}</h3>
          {club.id !== activeClub?.id ? <OtherClub club={club} choose={choose} />
            : isLoadingTeams ? <p className="picker-note" role="status">Chargement des équipes…</p>
            : teamsError ? <button type="button" className="picker-row" onClick={() => void refetchTeams()}>Réessayer de charger les équipes</button>
            : allTeams.length ? allTeams.map(team => (
              <TeamRow key={team.id} team={team} selected={team.id === activeTeam?.id} onClick={() => choose(club, team)} />
            )) : <p className="picker-note">Aucune équipe dans ce club.</p>}
        </section>
      ))}
    </RosterDialog>
  );
}
