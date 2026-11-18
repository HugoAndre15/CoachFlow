"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Shield, Users } from "lucide-react";
import RosterDialog from "@/app/dashboard/joueurs/parts/RosterDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useClubTeam } from "@/contexts/ClubTeamContext";
import ThemeToggle from "./ThemeToggle";
import TeamPicker from "./TeamPicker";

const roles: Record<string, string> = { PRESIDENT: "Président", RESPONSABLE: "Responsable", COACH: "Entraîneur" };

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const { activeClub, activeTeam, allClubs, allTeams, teamsError } = useClubTeam();
  const [dialog, setDialog] = useState<"team" | "account" | null>(null);
  if (!user) return null;
  const canChoose = allClubs.length > 1 || allTeams.length > 1 || !!teamsError;
  const identity = (
    <>
      <span className="workspace-crest"><Shield size={22} strokeWidth={1.7} aria-hidden="true" /></span>
      <span className="workspace-names">
        {activeClub && <small>{activeClub.name}</small>}
        <strong>{activeTeam?.name || (activeClub ? "Aucune équipe" : "Mon espace")}</strong>
      </span>
    </>
  );
  return (
    <header className="workspace-header">
      {canChoose ? (
        <button type="button" className="workspace-identity" onClick={() => setDialog("team")}
          aria-haspopup="dialog" aria-expanded={dialog === "team"}
          aria-label={`Changer d’équipe, ${activeTeam?.name || "Aucune équipe"}, ${activeClub?.name || "Aucun club"}`}>
          {identity}<ChevronDown size={17} aria-hidden="true" />
        </button>
      ) : <div className="workspace-identity">{identity}</div>}
      <div className="workspace-actions">
        <ThemeToggle />
        <button type="button" className="workspace-avatar" title="Mon compte" aria-label="Mon compte" aria-haspopup="dialog"
          onClick={() => setDialog("account")}>
          {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
        </button>
      </div>
      {dialog === "team" && <TeamPicker onClose={() => setDialog(null)} />}
      {dialog === "account" && (
        <RosterDialog title="Mon compte" onClose={() => setDialog(null)}>
          <div className="account-identity">
            <strong>{user.first_name} {user.last_name}</strong>
            <span>{user.email}</span>
            {activeClub && <span>{roles[activeClub.role] || activeClub.role} · {activeClub.name}</span>}
          </div>
          <div className="workspace-links">
            <Link className="nav-entry" href="/dashboard/clubs" onClick={() => setDialog(null)}><Shield size={18} />Mes clubs</Link>
            <Link className="nav-entry" href="/dashboard/teams" onClick={() => setDialog(null)}><Users size={18} />Mes équipes</Link>
            <Link className="nav-entry" href="/" onClick={() => setDialog(null)}>Accueil CoachFlow</Link>
            <button type="button" className="nav-entry text-accent-red" onClick={() => { setDialog(null); void logout(); }}>
              <LogOut size={18} />Déconnexion
            </button>
          </div>
        </RosterDialog>
      )}
    </header>
  );
}
