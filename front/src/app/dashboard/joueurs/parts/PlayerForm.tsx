"use client";

import { useState, type FormEvent } from "react";
import {
  playerService,
  type Player,
  type PlayerPosition,
  type PlayerStrongFoot,
  type PlayerStatus,
} from "@/services/playerService";
import RosterDialog from "./RosterDialog";
import {
  buttonClass,
  FEET,
  fieldClass,
  POSITIONS,
  primaryClass,
  requestError,
  STATUSES,
} from "./roster";

export default function PlayerForm({
  teamId,
  teamName,
  player,
  onClose,
  onSaved,
}: {
  teamId: string;
  teamName: string;
  player?: Player;
  onClose: () => void;
  onSaved: (player: Player) => void;
}) {
  const [firstName, setFirstName] = useState(player?.first_name ?? "");
  const [lastName, setLastName] = useState(player?.last_name ?? "");
  const [position, setPosition] = useState<PlayerPosition | "">(
    player?.position ?? "",
  );
  const [foot, setFoot] = useState<PlayerStrongFoot | "">(
    player?.strong_foot ?? "",
  );
  const [number, setNumber] = useState(player?.jersey_number?.toString() ?? "");
  const [status, setStatus] = useState<PlayerStatus>(
    player?.status ?? "ACTIVE",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!firstName.trim() || !lastName.trim()) {
      setError("Renseignez le prénom et le nom du joueur.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const identity = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        status,
      };
      const saved = player
        ? await playerService.updatePlayer(player.id, {
            ...identity,
            position: position || null,
            strong_foot: foot || null,
            jersey_number: number ? Number(number) : null,
          })
        : await playerService.createPlayer({
            ...identity,
            team_id: teamId,
            position: position || undefined,
            strong_foot: foot || undefined,
            jersey_number: number ? Number(number) : undefined,
          });
      onSaved(saved);
    } catch (error) {
      setError(
        requestError(
          error,
          "Enregistrement impossible. Vérifiez votre connexion puis réessayez.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <RosterDialog
      title={player ? "Modifier la fiche" : "Ajouter un joueur"}
      subtitle={teamName}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={buttonClass}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="player-form"
            disabled={busy}
            className={`${primaryClass} flex-1`}
          >
            {busy
              ? "Enregistrement…"
              : player
                ? "Enregistrer"
                : "Ajouter le joueur"}
          </button>
        </>
      }
    >
      <form
        id="player-form"
        onSubmit={submit}
        className="space-y-5"
        aria-busy={busy}
      >
        <p className="text-sm leading-relaxed text-slate-400">
          Le prénom et le nom suffisent pour commencer. Vous pourrez compléter
          la fiche plus tard.
        </p>
        <fieldset disabled={busy} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="player-first-name"
                className="mb-2 block text-sm text-slate-300"
              >
                Prénom <span className="text-accent-green">*</span>
              </label>
              <input
                id="player-first-name"
                autoFocus
                autoComplete="given-name"
                required
                maxLength={100}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label
                htmlFor="player-last-name"
                className="mb-2 block text-sm text-slate-300"
              >
                Nom <span className="text-accent-green">*</span>
              </label>
              <input
                id="player-last-name"
                autoComplete="family-name"
                required
                maxLength={100}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="player-position"
              className="mb-2 block text-sm text-slate-300"
            >
              Poste
            </label>
            <select
              id="player-position"
              value={position}
              onChange={(e) =>
                setPosition(e.target.value as PlayerPosition | "")
              }
              className={fieldClass}
            >
              <option value="">Non renseigné</option>
              {Object.entries(POSITIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="player-number"
                className="mb-2 block text-sm text-slate-300"
              >
                N° de maillot
              </label>
              <input
                id="player-number"
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                step={1}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className={fieldClass}
                placeholder="—"
              />
            </div>
            <div>
              <label
                htmlFor="player-foot"
                className="mb-2 block text-sm text-slate-300"
              >
                Pied fort
              </label>
              <select
                id="player-foot"
                value={foot}
                onChange={(e) =>
                  setFoot(e.target.value as PlayerStrongFoot | "")
                }
                className={fieldClass}
              >
                <option value="">Non renseigné</option>
                {Object.entries(FEET).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label
              htmlFor="player-status"
              className="mb-2 block text-sm text-slate-300"
            >
              Disponibilité
            </label>
            <select
              id="player-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as PlayerStatus)}
              className={fieldClass}
            >
              {Object.entries(STATUSES)
                .filter(
                  ([value]) =>
                    value !== "RETIRED" || player?.status === "RETIRED",
                )
                .map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
            </select>
            {player?.status === "RETIRED" && (
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Choisissez « Disponible » pour réintégrer ce joueur à
                l’effectif. Son historique est conservé.
              </p>
            )}
          </div>
        </fieldset>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300"
          >
            {error}
          </p>
        )}
      </form>
    </RosterDialog>
  );
}
