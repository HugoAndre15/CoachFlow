"use client";
import { useState } from "react";
import { playerService, type Player } from "@/services/playerService";
import RosterDialog from "./RosterDialog";
import { buttonClass, requestError } from "./roster";

export default function ArchivePlayerDialog({
  player,
  onClose,
  onArchived,
}: {
  player: Player;
  onClose: () => void;
  onArchived: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function archive() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await playerService.archivePlayer(player.id);
      onArchived();
    } catch (error) {
      setError(
        requestError(
          error,
          "Archivage impossible. Vérifiez votre connexion puis réessayez.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <RosterDialog
      title="Archiver ce joueur ?"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={busy}
            className={`${buttonClass} flex-1`}
          >
            Annuler
          </button>
          <button
            onClick={archive}
            disabled={busy}
            className={`${buttonClass} flex-1 border-rose-400/30 text-rose-300 hover:bg-rose-400/10`}
          >
            {busy ? "Archivage…" : "Archiver"}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-300">
        <strong className="text-white">
          {player.first_name} {player.last_name}
        </strong>{" "}
        sera retiré de l’effectif actuel. Ses matchs et ses statistiques seront
        conservés.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Vous pourrez retrouver sa fiche avec le filtre « Archivé » et le
        réintégrer à tout moment.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-rose-300">
          {error}
        </p>
      )}
    </RosterDialog>
  );
}
