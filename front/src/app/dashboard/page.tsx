'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useClubTeam } from "@/contexts/ClubTeamContext";
import LoadingState from "./parts/LoadingState";
import NoClubState from "./parts/NoClubState";
import ClubDashboard from "./parts/ClubDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const { activeClub, isLoadingClubs, refetchClubs } = useClubTeam();

  // Afficher un loader pendant le chargement du club
  if (isLoadingClubs) {
    return <LoadingState />;
  }

  // Affichage si l'utilisateur n'a pas de club
  if (!activeClub) {
    return <NoClubState onClubCreated={refetchClubs} />;
  }

  // Affichage si l'utilisateur a un club
  return (
    <ClubDashboard 
      club={activeClub} 
      userName={`${user?.first_name} ${user?.last_name}`} 
    />
  );
}
