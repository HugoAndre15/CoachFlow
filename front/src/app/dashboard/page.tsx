'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useUserClub } from "@/hooks/useUserClub";
import LoadingState from "./components/LoadingState";
import NoClubState from "./components/NoClubState";
import ClubDashboard from "./components/ClubDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const { club, isLoading, refetch } = useUserClub();

  // Afficher un loader pendant le chargement du club
  if (isLoading) {
    return <LoadingState />;
  }

  // Affichage si l'utilisateur n'a pas de club
  if (!club) {
    return <NoClubState onClubCreated={refetch} />;
  }

  // Affichage si l'utilisateur a un club
  return (
    <ClubDashboard 
      club={club} 
      userName={`${user?.first_name} ${user?.last_name}`} 
    />
  );
}
