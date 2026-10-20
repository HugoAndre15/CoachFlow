"use client";

import { useState, type FormEvent } from "react";
import { matchService, type MatchLocation } from "@/services/matchService";
import RosterDialog from "../../joueurs/parts/RosterDialog";
import {
  buttonClass,
  fieldClass,
  primaryClass,
  requestError,
} from "../../joueurs/parts/roster";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
}

export default function CreateMatchModal(props: Props) {
  return props.isOpen ? <MatchForm {...props} /> : null;
}

function MatchForm({ onClose, onSuccess, teamId }: Props) {
  const [opponent, setOpponent] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("15:00");
  const [location, setLocation] = useState<MatchLocation>("HOME");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !opponent.trim() || !matchDate || !matchTime) return;
    setBusy(true);
    setError("");
    try {
      await matchService.createMatch({
        team_id: teamId,
        opponent: opponent.trim(),
        location,
        match_date: new Date(`${matchDate}T${matchTime}:00`).toISOString(),
      });
      onSuccess();
    } catch (err) {
      setError(
        requestError(
          err,
          "Le match n’a pas pu être enregistré. Votre saisie est conservée, vous pouvez réessayer.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <RosterDialog
      title="Nouveau match"
      subtitle="Le prochain rendez-vous"
      busy={busy}
      onClose={onClose}
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
            form="create-match-form"
            disabled={busy || !opponent.trim() || !matchDate || !matchTime}
            className={`${primaryClass} flex-1`}
          >
            {busy ? "Enregistrement…" : "Créer le match"}
          </button>
        </>
      }
    >
      <form id="create-match-form" onSubmit={submit} className="space-y-5">
        <div>
          <label
            htmlFor="match-opponent"
            className="mb-2 block text-sm text-slate-300"
          >
            Adversaire
          </label>
          <input
            id="match-opponent"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="Ex: FC Barcelona"
            required
            autoFocus
            disabled={busy}
            className={`${fieldClass} w-full`}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2">
          <div className="min-w-0">
            <label
              htmlFor="match-date"
              className="mb-2 block text-sm text-slate-300"
            >
              Date
            </label>
            <input
              id="match-date"
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              required
              disabled={busy}
              className={`${fieldClass} min-w-0 w-full [color-scheme:dark]`}
            />
          </div>
          <div className="min-w-0">
            <label
              htmlFor="match-time"
              className="mb-2 block text-sm text-slate-300"
            >
              Heure
            </label>
            <input
              id="match-time"
              type="time"
              value={matchTime}
              onChange={(e) => setMatchTime(e.target.value)}
              required
              disabled={busy}
              className={`${fieldClass} min-w-0 w-full [color-scheme:dark]`}
            />
          </div>
        </div>
        <fieldset disabled={busy}>
          <legend className="mb-2 text-sm text-slate-300">Lieu</legend>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["HOME", "Domicile"],
                ["AWAY", "Extérieur"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm ${location === value ? "border-accent-green/60 bg-accent-green/10 text-emerald-300" : "border-white/15 text-slate-300"}`}
              >
                <input
                  type="radio"
                  name="match-location"
                  value={value}
                  checked={location === value}
                  onChange={() => setLocation(value)}
                  className="accent-emerald-500"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-400/10 p-3 text-sm text-rose-200"
          >
            {error}
          </p>
        )}
      </form>
    </RosterDialog>
  );
}
