'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useClubTeam } from "@/contexts/ClubTeamContext";
import LoadingState from "./parts/LoadingState";
import NoClubState from "./parts/NoClubState";
import ClubDashboard from "./parts/ClubDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const { activeClub, isLoadingClubs, isLoadingTeams, allTeams, refetchClubs } = useClubTeam();
  const router = useRouter();

  // Rediriger vers la page équipes si l'utilisateur a un club mais aucune équipe
  useEffect(() => {
    if (activeClub && !isLoadingTeams && allTeams.length === 0) {
      router.replace('/dashboard/teams');
    }
  }, [activeClub, isLoadingTeams, allTeams, router]);

  // Afficher un loader pendant le chargement du club
  if (isLoadingClubs) {
    return <LoadingState />;
  }

  // Affichage si l'utilisateur n'a pas de club
  if (!activeClub) {
    return <NoClubState onClubCreated={refetchClubs} />;
  }

  // Loader pendant le chargement des équipes (avant la redirection potentielle)
  if (isLoadingTeams) {
    return <LoadingState />;
  }

  // Si pas d'équipe, ne rien afficher (la redirection s'effectue)
  if (allTeams.length === 0) {
    return <LoadingState />;
  }

  // Affichage si l'utilisateur a un club et au moins une équipe
  return (
    <ClubDashboard 
      club={activeClub} 
      userName={`${user?.first_name} ${user?.last_name}`} 
    />
  );
}
