"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Plus, RefreshCw, Users } from "lucide-react";
import type { Team } from "@/services/teamService";
import type { PlayerStatsPeriod } from "@/services/playerService";
import {
  dashboardService,
  type TeamDashboardData,
} from "@/services/dashboardService";
import {
  buttonClass,
  fieldClass,
  PERIODS,
  requestError,
} from "../joueurs/parts/roster";
import CreateMatchModal from "../matchs/parts/CreateMatchModal";
import MatchFocus from "./dashboard/MatchFocus";
import TeamSeason from "./dashboard/TeamSeason";

export function DashboardLoading() {
  return (
    <div role="status" className="space-y-5 py-5 text-sm text-slate-400">
      <p>Chargement de la vue d’équipe…</p>
      <div
        aria-hidden="true"
        className="h-60 rounded-2xl bg-white/[0.04] motion-safe:animate-pulse"
      />
    </div>
  );
}

export default function TeamDashboard({ team }: { team: Team }) {
  const [data, setData] = useState<TeamDashboardData | null>(null);
  const [period, setPeriod] = useState<PlayerStatsPeriod>("SEASON");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [create, setCreate] = useState(false);
  const [notice, setNotice] = useState("");
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await dashboardService.getTeamDashboard(team.id, period);
      if (id === requestId.current) setData(result);
    } catch (err) {
      if (id === requestId.current)
        setError(
          requestError(
            err,
            "Impossible de charger la vue d’équipe. Vérifiez votre connexion puis réessayez.",
          ),
        );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [team.id, period]);

  useEffect(() => {
    void refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      requestId.current++;
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const current = data?.meta.period === period ? data : null;
  return (
    <div className="space-y-7 pb-6 text-white sm:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 break-words text-xs font-medium uppercase tracking-[0.18em] text-accent-green">
            {team.name} <span className="mx-2 text-slate-600">/</span>{" "}
            {team.category}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Vue d’équipe
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Le prochain rendez-vous. Le groupe. Les résultats.
          </p>
        </div>
        {data && (
          <button onClick={() => setCreate(true)} className={buttonClass}>
            <Plus size={17} aria-hidden="true" /> Nouveau match
          </button>
        )}
      </header>

      {notice && (
        <p role="status" className="text-sm text-emerald-300">
          {notice}
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/25 bg-rose-400/5 p-4"
        >
          <div className="min-w-0 text-sm">
            <p className="text-rose-200">{error}</p>
            {current && (
              <p className="mt-1 text-slate-400">
                Les données affichées datent de la dernière mise à jour.
              </p>
            )}
          </div>
          <button
            className={buttonClass}
            onClick={() => void refresh()}
            disabled={loading}
          >
            Réessayer
          </button>
        </div>
      )}
      {!data && loading && <DashboardLoading />}

      {data && (
        <>
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <MatchFocus
              data={data}
              teamName={team.name}
              onCreate={() => setCreate(true)}
            />
            <section
              aria-labelledby="group-title"
              className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-dark-secondary p-5 sm:p-6"
            >
              <div className="flex items-center gap-2 text-slate-400">
                <Users size={17} aria-hidden="true" />
                <h2 id="group-title" className="text-sm font-medium">
                  Le groupe aujourd’hui
                </h2>
              </div>
              {data.roster.total ? (
                <>
                  <p className="mt-5">
                    <strong className="text-5xl font-semibold tabular-nums tracking-tight">
                      {data.roster.available}
                    </strong>
                    <span className="ml-2 text-sm text-slate-400">
                      / {data.roster.total} joueurs disponibles
                    </span>
                  </p>
                  <div
                    className="mt-5 flex h-2 overflow-hidden rounded-full bg-white/5"
                    aria-hidden="true"
                  >
                    <span
                      className="bg-accent-green"
                      style={{
                        width: `${(100 * data.roster.available) / data.roster.total}%`,
                      }}
                    />
                    <span
                      className="bg-rose-400"
                      style={{
                        width: `${(100 * data.roster.injured) / data.roster.total}%`,
                      }}
                    />
                    <span
                      className="bg-amber-300"
                      style={{
                        width: `${(100 * data.roster.suspended) / data.roster.total}%`,
                      }}
                    />
                  </div>
                  <dl className="my-5 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-400">Blessés</dt>
                      <dd className="mt-1 text-lg font-medium text-rose-300">
                        {data.roster.injured}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Suspendus</dt>
                      <dd className="mt-1 text-lg font-medium text-amber-200">
                        {data.roster.suspended}
                      </dd>
                    </div>
                  </dl>
                </>
              ) : (
                <div className="my-6">
                  <p className="text-xl font-semibold">
                    Votre groupe prend forme ici.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    Ajoutez vos premiers joueurs pour préparer les présences et
                    les compositions.
                  </p>
                </div>
              )}
              <Link
                href="/dashboard/joueurs"
                className={`${buttonClass} mt-auto w-full justify-between`}
              >
                {data.roster.total ? "Voir les joueurs" : "Ajouter mes joueurs"}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </section>
          </div>

          {data.overdue > 0 && (
            <Link
              href="/dashboard/matchs"
              className="flex min-h-11 items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm text-amber-100 hover:bg-amber-300/10 focus-visible:outline-2 focus-visible:outline-accent-green"
            >
              <CalendarDays size={18} className="shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                {data.overdue} match{data.overdue > 1 ? "s" : ""} passé{data.overdue > 1 ? "s" : ""} reste{data.overdue > 1 ? "nt" : ""} à vérifier.
              </span>
              <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
            </Link>
          )}

          <section aria-labelledby="season-title">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h2 id="season-title" className="text-xl font-semibold">
                  Le bilan de l’équipe
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Matchs terminés uniquement · Saison à partir du 1er juillet
                </p>
              </div>
              <div className="flex w-full items-end gap-2 sm:w-auto">
                <div className="min-w-0 flex-1 text-xs text-slate-400 sm:w-48">
                  <label htmlFor="dashboard-period">Période du bilan</label>
                  <select
                    id="dashboard-period"
                    value={period}
                    onChange={(e) =>
                      setPeriod(e.target.value as PlayerStatsPeriod)
                    }
                    className={`${fieldClass} mt-1.5 w-full`}
                  >
                    {Object.entries(PERIODS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className={`${buttonClass} shrink-0 px-3`}
                  disabled={loading}
                  onClick={() => void refresh()}
                  aria-label="Actualiser la vue d’équipe"
                >
                  <RefreshCw
                    size={17}
                    className={loading ? "motion-safe:animate-spin" : ""}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
            {current ? (
              <TeamSeason data={current} />
            ) : loading ? (
              <DashboardLoading />
            ) : (
              <p className="py-5 text-sm text-slate-400">
                Le bilan de cette période n’a pas pu être chargé.
              </p>
            )}
          </section>
          <p className="text-xs text-slate-400">
            {loading
              ? "Actualisation en cours…"
              : `Dernière mise à jour à ${new Date(data.meta.to).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
        </>
      )}
      {create && (
        <CreateMatchModal
          isOpen
          teamId={team.id}
          onClose={() => setCreate(false)}
          onSuccess={() => {
            setCreate(false);
            setNotice(
              "Match créé. Vous pouvez maintenant préparer les présences.",
            );
            void refresh();
          }}
        />
      )}
    </div>
  );
}
