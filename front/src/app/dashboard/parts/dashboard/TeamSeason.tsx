import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type {
  DashboardLeader,
  TeamDashboardData,
} from "@/services/dashboardService";

const results = {
  WIN: {
    label: "Victoire",
    short: "V",
    color: "bg-emerald-400/10 text-emerald-300",
  },
  DRAW: { label: "Nul", short: "N", color: "bg-slate-400/10 text-slate-300" },
  LOSS: { label: "Défaite", short: "D", color: "bg-rose-400/10 text-rose-300" },
};
const linkClass =
  "inline-flex min-h-11 items-center gap-2 text-sm text-emerald-300 hover:text-white focus-visible:outline-2 focus-visible:outline-accent-green";

function Leaders({
  title,
  rows,
  unit,
}: {
  title: string;
  rows: DashboardLeader[];
  unit: string;
}) {
  return (
    <div className="min-w-0">
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
        {title}
      </h4>
      {rows.length ? (
        <ol className="divide-y divide-white/5">
          {rows.map((player) => (
            <li key={player.id} className="flex items-center gap-3 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-xs text-slate-400">
                {player.number ?? "–"}
              </span>
              <span className="min-w-0 flex-1 break-words text-sm">
                {player.name}
                {player.archived && (
                  <span className="ml-1 text-xs text-slate-400">(archivé)</span>
                )}
              </span>
              <span
                className="shrink-0 text-sm font-semibold tabular-nums"
                aria-label={`${player.value} ${unit}`}
              >
                {player.value}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-3 text-sm text-slate-400">
          Aucun{unit === "buts" ? " but" : "e passe décisive"} enregistré
          {unit === "buts" ? "" : "e"}.
        </p>
      )}
    </div>
  );
}

export default function TeamSeason({ data }: { data: TeamDashboardData }) {
  const { totals, attendance } = data;
  if (!totals.matches)
    return (
      <div className="rounded-xl border border-dashed border-white/15 px-5 py-8 text-center">
        <h3 className="font-medium">
          Le bilan se construit au fil des matchs.
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
          Aucun match terminé sur cette période. Terminez votre premier match ou
          choisissez une autre période pour retrouver vos résultats.
        </p>
        <Link href="/dashboard/matchs" className={`${linkClass} mt-3`}>
          Voir les matchs <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 bg-dark-secondary lg:grid-cols-4">
        {[
          [
            "Matchs joués",
            totals.matches,
            `${totals.wins} victoire${totals.wins > 1 ? "s" : ""}`,
          ],
          [
            "Buts marqués",
            totals.scored,
            `${totals.conceded} encaissé${totals.conceded > 1 ? "s" : ""}`,
          ],
          ["Passes décisives", totals.assists, "Sur la période"],
          [
            "Présence",
            attendance.rate === null ? "—" : `${attendance.rate} %`,
            attendance.recorded
              ? `${attendance.present} / ${attendance.recorded} présences renseignées`
              : "Pas de présence renseignée",
          ],
        ].map(([label, value, note]) => (
          <div
            key={label}
            className="min-w-0 border-b border-r border-white/5 p-4 sm:p-5"
          >
            <dt className="text-xs text-slate-400">{label}</dt>
            <dd className="mt-2">
              <span className="text-3xl font-semibold tabular-nums tracking-tight">
                {value}
              </span>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {note}
              </p>
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section aria-labelledby="results-title" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="results-title" className="font-semibold">
              Derniers résultats
            </h3>
            <span className="text-xs text-slate-400">
              {totals.wins} V · {totals.draws} N · {totals.losses} D
            </span>
          </div>
          <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
            {data.recent.map((match) => {
              const result = results[match.result];
              return (
                <li key={match.id}>
                  <Link
                    href={`/dashboard/matchs/${match.id}`}
                    aria-label={`${result.label} contre ${match.opponent}, ${match.scored} à ${match.conceded}, voir le résumé`}
                    className="group flex min-h-20 items-center gap-3 rounded-md py-3 focus-visible:outline-2 focus-visible:outline-accent-green sm:gap-4"
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${result.color}`}
                      aria-hidden="true"
                    >
                      {result.short}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium group-hover:text-emerald-300">
                        {match.opponent}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(match.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {match.location === "HOME" ? "Domicile" : "Extérieur"}
                      </p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-lg font-semibold tabular-nums">
                      {match.scored} <span className="text-slate-600">–</span>{" "}
                      {match.conceded}
                    </span>
                    <ArrowRight
                      size={15}
                      className="shrink-0 text-slate-400"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            Score de votre équipe à gauche, à domicile comme à l’extérieur.
          </p>
          <Link href="/dashboard/matchs" className={`${linkClass} mt-2`}>
            Tous les matchs <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
        <section
          aria-labelledby="contributions-title"
          className="min-w-0 rounded-xl border border-white/10 bg-dark-secondary p-5"
        >
          <h3 id="contributions-title" className="mb-5 font-semibold">
            Les contributions du groupe
          </h3>
          <div className="space-y-6">
            <Leaders title="Buteurs" rows={data.scorers} unit="buts" />
            <Leaders
              title="Passeurs"
              rows={data.assisters}
              unit="passes décisives"
            />
          </div>
          <Link href="/dashboard/joueurs" className={`${linkClass} mt-4`}>
            Le tableau des joueurs <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">
        Présence : présents ÷ (présents + absents). Les présences incertaines et
        non renseignées sont exclues du taux. Les joueurs archivés restent
        inclus dans l’historique.
      </p>
    </div>
  );
}
