import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Radio } from "lucide-react";
import type { TeamDashboardData } from "@/services/dashboardService";
import { buttonClass, primaryClass } from "../../joueurs/parts/roster";

export default function MatchFocus({
  data,
  teamName,
  onCreate,
}: {
  data: TeamDashboardData;
  teamName: string;
  onCreate: () => void;
}) {
  const match = data.live ?? data.next;
  if (!match)
    return (
      <section
        aria-labelledby="match-focus-title"
        className="flex min-w-0 flex-col items-start justify-center rounded-2xl border border-dashed border-white/20 p-6 sm:p-8"
      >
        <CalendarDays
          size={25}
          className="mb-5 text-accent-green"
          aria-hidden="true"
        />
        <h2 id="match-focus-title" className="text-2xl font-semibold">
          Le prochain match commence ici.
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
          Un adversaire, une date, puis les présences. Tout sera prêt pour le
          jour du match.
        </p>
        <button onClick={onCreate} className={`${primaryClass} mt-6`}>
          Planifier un match <ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>
    );
  const live = match.status === "LIVE";
  const date = new Date(match.date);
  return (
    <section
      aria-labelledby="match-focus-title"
      className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-accent-green/25 bg-dark-secondary"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <h2
          id="match-focus-title"
          className="flex items-center gap-2 text-sm font-medium text-emerald-300"
        >
          {live ? (
            <Radio size={17} aria-hidden="true" />
          ) : (
            <CalendarDays size={17} aria-hidden="true" />
          )}
          {live ? "Match en cours" : "Prochain rendez-vous"}
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin size={14} aria-hidden="true" />
          {match.location === "HOME" ? "À domicile" : "À l’extérieur"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4 sm:gap-6">
          <time
            dateTime={match.date}
            className="flex w-16 shrink-0 flex-col items-center border-r border-white/10 pr-4 sm:w-20 sm:pr-6"
            aria-label={date.toLocaleString("fr-FR", {
              dateStyle: "full",
              timeStyle: "short",
            })}
          >
            <span className="text-xs uppercase text-slate-400">
              {date.toLocaleDateString("fr-FR", { month: "short" })}
            </span>
            <span className="my-1 text-4xl font-semibold tabular-nums">
              {date.getDate()}
            </span>
            <span className="text-xs text-slate-400">
              {date.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </time>
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm text-slate-400">{teamName}</p>
            <p className="mt-1 text-xs text-slate-400">contre</p>
            <p className="mt-1 break-words text-xl font-semibold leading-snug sm:text-2xl">
              {match.opponent}
            </p>
            {live && (
              <p
                className="mt-3 text-4xl font-semibold tabular-nums"
                aria-label={`Score : ${teamName} ${match.scored}, ${match.opponent} ${match.conceded}`}
              >
                {match.scored}
                <span className="mx-3 text-slate-600">–</span>
                {match.conceded}
              </p>
            )}
          </div>
        </div>
        {!live && (
          <div className="my-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-white/10 py-4 text-xs">
            <span>
              <strong className="mr-1 text-base text-emerald-300">
                {match.attendance.present}
              </strong>{" "}
              présents
            </span>
            <span>
              <strong className="mr-1 text-base text-amber-200">
                {match.attendance.uncertain}
              </strong>{" "}
              incertains
            </span>
            <span>
              <strong className="mr-1 text-base text-slate-200">
                {match.attendance.unknown}
              </strong>{" "}
              à renseigner
            </span>
            {match.attendance.absent > 0 && (
              <span>
                <strong className="mr-1 text-base">
                  {match.attendance.absent}
                </strong>{" "}
                absents
              </span>
            )}
          </div>
        )}
        <div
          className={`mt-auto flex flex-wrap items-center gap-3 ${live ? "pt-5" : ""}`}
        >
          <Link
            href={
              live
                ? `/dashboard/direct?matchId=${match.id}`
                : `/dashboard/matchs/${match.id}`
            }
            className={`${primaryClass} w-full justify-between sm:w-auto`}
          >
            {live ? "Reprendre le direct" : "Préparer le match"}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link
            href="/dashboard/matchs"
            className={`${buttonClass} w-full sm:w-auto`}
          >
            Tous les matchs
          </Link>
        </div>
        {live && data.next && (
          <Link
            href={`/dashboard/matchs/${data.next.id}`}
            className="mt-4 flex min-h-11 items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-accent-green"
          >
            <span className="min-w-0 break-words">
              Ensuite : {data.next.opponent} ·{" "}
              {new Date(data.next.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <ArrowRight size={15} className="shrink-0" aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}
