import { Archive, Pencil } from "lucide-react";
import type { PlayerOverview } from "@/services/playerService";
import RosterDialog from "./RosterDialog";
import { Jersey, PlayerStatusBadge } from "./PlayerTable";
import { buttonClass, FEET, POSITIONS, primaryClass } from "./roster";

const ZONES: Record<string, string> = {
  LEFT: "Gauche",
  RIGHT: "Droite",
  AXIS: "Axe",
  BOX: "Surface",
  OUTSIDE: "Extérieur",
  DEF_LEFT: "Défense · gauche",
  DEF_CENTER: "Défense · centre",
  DEF_RIGHT: "Défense · droite",
  MID_LEFT: "Milieu · gauche",
  MID_CENTER: "Milieu · centre",
  MID_RIGHT: "Milieu · droite",
  ATT_LEFT: "Attaque · gauche",
  ATT_CENTER: "Attaque · centre",
  ATT_RIGHT: "Attaque · droite",
};
const BODY_PARTS: Record<string, string> = {
  LEFT_FOOT: "Pied gauche",
  RIGHT_FOOT: "Pied droit",
  HEAD: "Tête",
};

function StatLine({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium tabular-nums text-white">{value}</dd>
    </div>
  );
}

export default function PlayerDetailModal({
  player,
  periodLabel,
  onClose,
  onEdit,
  onArchive,
}: {
  player: PlayerOverview;
  periodLabel: string;
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const s = player.stats,
    a = s.attendance;
  return (
    <RosterDialog
      title={`${player.first_name} ${player.last_name}`}
      subtitle="Fiche joueur"
      drawer
      onClose={onClose}
      footer={
        <>
          <button onClick={onEdit} className={`${primaryClass} flex-1`}>
            <Pencil size={16} aria-hidden="true" />
            {player.status === "RETIRED"
              ? "Modifier / réintégrer"
              : "Modifier la fiche"}
          </button>
          {player.status !== "RETIRED" && (
            <button onClick={onArchive} className={buttonClass}>
              <Archive size={16} aria-hidden="true" />
              Archiver
            </button>
          )}
        </>
      }
    >
      <div className="space-y-7">
        <div className="flex items-center gap-4">
          <Jersey number={player.jersey_number} />
          <div>
            <p className="text-sm text-slate-200">
              {POSITIONS[player.position ?? ""] ?? "Poste à renseigner"}{" "}
              <span className="text-slate-600">/</span>{" "}
              <span className="text-slate-400">
                Pied : {FEET[player.strong_foot ?? ""] ?? "non renseigné"}
              </span>
            </p>
            <div className="mt-1.5">
              <PlayerStatusBadge status={player.status} />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-dark px-4 py-3 text-xs text-slate-400">
          {periodLabel} <span className="mx-1 text-slate-600">·</span> Matchs
          terminés uniquement
        </div>
        <section aria-labelledby="presence-title">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 id="presence-title" className="font-semibold">
              Présences
            </h3>
            <span className="text-xl font-semibold tabular-nums text-emerald-300">
              {a.rate === null ? "—" : `${a.rate} %`}
            </span>
          </div>
          <div
            className="mb-2 flex h-1.5 overflow-hidden rounded-full bg-white/10"
            aria-hidden="true"
          >
            <div
              className="bg-accent-green"
              style={{ width: `${a.rate ?? 0}%` }}
            />
            <div
              className="bg-rose-400/70"
              style={{ width: `${a.rate === null ? 0 : 100 - a.rate}%` }}
            />
          </div>
          <dl className="divide-y divide-white/[0.06]">
            <StatLine label="Présent" value={a.present} />
            <StatLine label="Absent" value={a.absent} />
            <StatLine label="Présence incertaine" value={a.uncertain} />
            <StatLine label="Non renseignée" value={a.unknown} />
          </dl>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Taux calculé sur {a.recorded} présence{a.recorded > 1 ? "s" : ""}{" "}
            renseignée{a.recorded > 1 ? "s" : ""} : présent ou absent. Les
            feuilles où le joueur ne figure pas sont exclues.
          </p>
        </section>
        <section aria-labelledby="participation-title">
          <h3 id="participation-title" className="mb-2 font-semibold">
            Participation
          </h3>
          <dl className="divide-y divide-white/[0.06]">
            <StatLine label="Matchs joués" value={s.total_matches} />
            <StatLine label="Titularisations" value={s.matches_as_starter} />
            <StatLine label="Entrées en jeu" value={s.matches_as_substitute} />
            <StatLine
              label="Sur le banc, sans entrer"
              value={s.unused_substitute}
            />
          </dl>
        </section>
        <section aria-labelledby="contribution-title">
          <h3 id="contribution-title" className="mb-3 font-semibold">
            Avec le ballon
          </h3>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
            {[
              ["Buts", s.goals],
              ["Passes décisives", s.assists],
            ].map(([label, value]) => (
              <div key={label} className="bg-dark p-4">
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="mt-2 text-3xl font-semibold tabular-nums text-white">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <dl className="mt-2 divide-y divide-white/[0.06]">
            <StatLine label="Récupérations" value={s.recoveries} />
            <StatLine label="Pertes de balle" value={s.ball_losses} />
          </dl>
        </section>
        <section aria-labelledby="discipline-title">
          <h3 id="discipline-title" className="mb-2 font-semibold">
            Discipline
          </h3>
          <dl className="divide-y divide-white/[0.06]">
            <StatLine label="Cartons jaunes" value={s.yellow_cards} />
            <StatLine label="Cartons rouges" value={s.red_cards} />
          </dl>
        </section>
        {s.goals > 0 && (
          <details className="rounded-lg border border-white/10 px-4">
            <summary className="cursor-pointer py-4 text-sm font-medium text-slate-200 focus-visible:outline-2 focus-visible:outline-accent-green">
              Détail des buts
            </summary>
            <div className="space-y-4 pb-4">
              {[
                { values: s.goals_by_zone, labels: ZONES, title: "Zone" },
                {
                  values: s.goals_by_body_part,
                  labels: BODY_PARTS,
                  title: "Partie du corps",
                },
              ].map(({ values: counts, labels, title }) => {
                const missing =
                  s.goals -
                  Object.values(counts).reduce((sum, value) => sum + value, 0);
                return (
                  <div key={title}>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      {title}
                    </p>
                    <dl>
                      {Object.entries(counts)
                        .filter(([, count]) => count > 0)
                        .map(([key, count]) => (
                          <StatLine
                            key={key}
                            label={labels[key] ?? key}
                            value={count}
                          />
                        ))}
                      {missing > 0 && (
                        <StatLine label="Non renseignée" value={missing} />
                      )}
                    </dl>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>
    </RosterDialog>
  );
}
