"use client";

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { useClubTeam } from "@/contexts/ClubTeamContext";
import NoClubState from "./parts/NoClubState";
import TeamDashboard, { DashboardLoading } from "./parts/TeamDashboard";
import { buttonClass, primaryClass } from "./joueurs/parts/roster";

export default function Dashboard() {
  const {
    activeClub,
    activeTeam,
    isLoadingClubs,
    isLoadingTeams,
    clubsError,
    teamsError,
    refetchClubs,
    refetchTeams,
  } = useClubTeam();
  if (isLoadingClubs || isLoadingTeams) return <DashboardLoading />;
  if (clubsError || teamsError)
    return (
      <div className="mx-auto max-w-lg py-16 text-center text-white">
        <h1 className="text-2xl font-semibold">Retrouvons votre équipe</h1>
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {clubsError || teamsError}
        </p>
        <button
          onClick={() => void (clubsError ? refetchClubs() : refetchTeams())}
          className={`${buttonClass} mt-5`}
        >
          Réessayer
        </button>
      </div>
    );
  if (!activeClub) return <NoClubState onClubCreated={refetchClubs} />;
  if (!activeTeam)
    return (
      <div className="mx-auto max-w-md py-16 text-center text-white">
        <Users
          size={32}
          className="mx-auto mb-5 text-accent-green"
          aria-hidden="true"
        />
        <p className="mb-2 break-words text-sm text-accent-green">
          {activeClub.name}
        </p>
        <h1 className="text-2xl font-semibold">
          Place à votre première équipe
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Créez votre équipe, ajoutez vos joueurs, puis préparez votre premier
          match.
        </p>
        <Link href="/dashboard/teams" className={`${primaryClass} mt-6`}>
          Créer mon équipe <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  return <TeamDashboard key={activeTeam.id} team={activeTeam} />;
}
