"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Plus, RefreshCw, Users } from "lucide-react";
import { useClubTeam } from "@/contexts/ClubTeamContext";
import {
  playerService,
  type PlayerOverview,
  type PlayerStatsPeriod,
  type TeamPlayerOverview,
} from "@/services/playerService";
import type { Team } from "@/services/teamService";
import PlayerTable from "./parts/PlayerTable";
import JoueursFilters from "./parts/JoueursFilters";
import PlayerDetailModal from "./parts/PlayerDetailModal";
import PlayerForm from "./parts/PlayerForm";
import ArchivePlayerDialog from "./parts/ArchivePlayerDialog";
import {
  buttonClass,
  DEFAULT_FILTERS,
  fieldClass,
  filterAndSortPlayers,
  PERIODS,
  primaryClass,
  requestError,
  type RosterFilters,
  type SortKey,
  type StatusFilter,
} from "./parts/roster";

type DialogState =
  | { type: "create" }
  | { type: "details" | "edit" | "archive"; player: PlayerOverview }
  | null;

export default function JoueursPage() {
  const {
    activeTeam,
    isLoadingClubs,
    isLoadingTeams,
    clubsError,
    teamsError,
    refetchClubs,
    refetchTeams,
  } = useClubTeam();
  if (activeTeam) return <TeamRoster key={activeTeam.id} team={activeTeam} />;
  if (isLoadingClubs || isLoadingTeams) return <RosterLoading />;
  return (
    <div className="mx-auto max-w-md py-20 text-center text-white">
      <Users
        size={32}
        className="mx-auto mb-5 text-accent-green"
        aria-hidden="true"
      />
      <h1 className="text-2xl font-semibold">Votre effectif commence ici</h1>
      {clubsError || teamsError ? (
        <>
          <p role="alert" className="mt-3 text-sm text-rose-300">
            {clubsError || teamsError}
          </p>
          <button
            onClick={() => void (clubsError ? refetchClubs() : refetchTeams())}
            className={`${buttonClass} mt-5`}
          >
            Réessayer
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Sélectionnez une équipe dans la barre du haut, ou créez votre
            première équipe pour ajouter vos joueurs.
          </p>
          <Link href="/dashboard/teams" className={`${primaryClass} mt-6`}>
            Mes équipes
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </>
      )}
    </div>
  );
}

function RosterLoading() {
  return (
    <div role="status" className="space-y-4 p-5 text-sm text-slate-400">
      <p>Chargement de l’effectif…</p>
      <div aria-hidden="true" className="space-y-3 motion-safe:animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}

function TeamRoster({ team }: { team: Team }) {
  const [data, setData] = useState<TeamPlayerOverview | null>(null);
  const [period, setPeriod] = useState<PlayerStatsPeriod>("ALL");
  const [filters, setFilters] = useState<RosterFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const requestId = useRef(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await playerService.getTeamOverview(team.id, period);
      if (id === requestId.current) setData(result);
    } catch (error) {
      if (id === requestId.current)
        setError(
          requestError(
            error,
            "Impossible de charger l’effectif. Vérifiez votre connexion puis réessayez.",
          ),
        );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [team.id, period]);

  useEffect(() => {
    void refresh();
    return () => {
      requestId.current++;
    };
  }, [refresh]);

  const currentData = data?.meta.period === period ? data : null;
  const filtered = useMemo(
    () => filterAndSortPlayers(currentData?.players ?? [], filters),
    [currentData, filters],
  );
  const counts = data?.players.reduce(
    (acc, p) => {
      acc[p.status]++;
      if (p.status !== "RETIRED") acc.CURRENT++;
      return acc;
    },
    { CURRENT: 0, ACTIVE: 0, INJURED: 0, SUSPENDED: 0, RETIRED: 0 },
  );

  function open(next: DialogState) {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setDialog(next);
  }
  function close() {
    setDialog(null);
    requestAnimationFrame(() => {
      if (triggerRef.current?.isConnected) triggerRef.current.focus();
      else titleRef.current?.focus();
    });
  }
  function saved(message: string, status?: StatusFilter) {
    close();
    setNotice(message);
    if (status) setFilters({ ...DEFAULT_FILTERS, status });
    void refresh();
  }
  function sort(key: SortKey) {
    setFilters((previous) => ({
      ...previous,
      sort: key,
      direction:
        previous.sort === key
          ? previous.direction === "asc"
            ? "desc"
            : "asc"
          : key === "name" || key === "number"
            ? "asc"
            : "desc",
    }));
  }

  const countItems: { key: StatusFilter; label: string; color: string }[] = [
    { key: "CURRENT", label: "dans l’effectif", color: "text-white" },
    { key: "ACTIVE", label: "disponibles", color: "text-emerald-300" },
    { key: "INJURED", label: "blessés", color: "text-rose-300" },
    { key: "SUSPENDED", label: "suspendus", color: "text-amber-300" },
  ];

  return (
    <div className="min-w-0 space-y-6 pb-6 text-white">
      <header>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-accent-green">
          {team.name} <span className="px-1 text-slate-600">/</span>{" "}
          {team.category}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              ref={titleRef}
              tabIndex={-1}
              className="text-3xl font-semibold tracking-tight focus:outline-none sm:text-4xl"
            >
              L’effectif
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Vos joueurs, leur présence, leur contribution.
            </p>
          </div>
          <button
            onClick={() => open({ type: "create" })}
            className={primaryClass}
          >
            <Plus size={18} aria-hidden="true" />
            Ajouter un joueur
          </button>
        </div>
        {counts && (
          <div
            className="mt-6 flex flex-wrap gap-x-5 gap-y-1 border-y border-white/10 py-2 sm:gap-x-8"
            aria-label="Disponibilité de l’effectif"
          >
            {countItems.map((item) => (
              <button
                key={item.key}
                aria-pressed={filters.status === item.key}
                onClick={() =>
                  setFilters((previous) => ({ ...previous, status: item.key }))
                }
                className={`flex min-h-11 items-baseline gap-2 rounded py-1 text-sm focus-visible:outline-2 focus-visible:outline-accent-green ${filters.status === item.key ? "text-slate-200" : "text-slate-400 hover:text-slate-200"}`}
              >
                <span
                  className={`text-xl font-semibold tabular-nums ${item.color}`}
                >
                  {counts[item.key]}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {notice && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-emerald-300"
        >
          <Check size={17} aria-hidden="true" />
          {notice}
        </p>
      )}

      <section
        aria-label="Tableau de l’effectif"
        className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-dark-secondary"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 p-4 sm:p-5">
          <div>
            <h2 className="font-semibold">Le suivi des joueurs</h2>
            <p className="mt-1 text-xs text-slate-400">
              {currentData
                ? `${currentData.meta.completed_matches} match${currentData.meta.completed_matches > 1 ? "s" : ""} terminé${currentData.meta.completed_matches > 1 ? "s" : ""} sur la période`
                : "Statistiques des matchs terminés"}
            </p>
          </div>
          <div className="flex w-full items-end gap-2 sm:w-auto">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="roster-period"
                className="mb-1.5 block text-xs text-slate-400"
              >
                Période
              </label>
              <select
                id="roster-period"
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value as PlayerStatsPeriod);
                  setNotice("");
                }}
                className={`${fieldClass} sm:min-w-48 sm:text-sm`}
              >
                {Object.entries(PERIODS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => void refresh()}
              disabled={loading}
              className={`${buttonClass} px-3`}
              aria-label="Actualiser l’effectif"
              title="Actualiser"
            >
              <RefreshCw
                size={17}
                aria-hidden="true"
                className={loading ? "motion-safe:animate-spin" : ""}
              />
            </button>
          </div>
        </div>
        <JoueursFilters filters={filters} onChange={setFilters} />
        {loading || (!currentData && !error) ? (
          <RosterLoading />
        ) : error ? (
          <div className="border-t border-white/10 px-5 py-12 text-center">
            <p role="alert" className="text-sm text-rose-300">
              {error}
            </p>
            <button
              onClick={() => void refresh()}
              className={`${buttonClass} mt-4`}
            >
              Réessayer
            </button>
          </div>
        ) : filtered.length ? (
          <>
            <PlayerTable
              players={filtered}
              filters={filters}
              onSort={sort}
              onOpen={(player) => open({ type: "details", player })}
            />
            <div className="flex flex-wrap justify-between gap-2 border-t border-white/10 px-5 py-3 text-xs text-slate-400">
              <span aria-live="polite">
                {filtered.length} joueur{filtered.length > 1 ? "s" : ""} affiché
                {filtered.length > 1 ? "s" : ""}
              </span>
              <span>Ouvrez une fiche pour voir le détail.</span>
            </div>
          </>
        ) : (
          <div className="border-t border-white/10 px-5 py-12 text-center">
            <Users
              className="mx-auto mb-3 text-slate-400"
              size={28}
              aria-hidden="true"
            />
            <h3 className="font-medium">
              {currentData?.players.length
                ? "Aucun joueur dans cette sélection"
                : "À vous de composer l’effectif"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
              {currentData?.players.length
                ? "Changez vos filtres pour retrouver vos joueurs, y compris les joueurs archivés."
                : "Ajoutez votre premier joueur. Ses statistiques se rempliront au fil des matchs."}
            </p>
            {currentData?.players.length ? (
              <button
                onClick={() =>
                  setFilters({
                    ...DEFAULT_FILTERS,
                    status: counts?.CURRENT ? "CURRENT" : "RETIRED",
                  })
                }
                className={`${buttonClass} mt-5`}
              >
                Voir{" "}
                {counts?.CURRENT ? "l’effectif actuel" : "les joueurs archivés"}
              </button>
            ) : (
              <button
                onClick={() => open({ type: "create" })}
                className={`${primaryClass} mt-5`}
              >
                <Plus size={16} aria-hidden="true" />
                Ajouter un joueur
              </button>
            )}
          </div>
        )}
      </section>

      <details className="text-sm text-slate-400">
        <summary className="w-fit cursor-pointer rounded py-2 text-xs font-medium hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-accent-green">
          Comment lire ces statistiques ?
        </summary>
        <div className="mt-2 grid gap-4 rounded-xl border border-white/10 bg-dark-secondary p-5 text-xs leading-relaxed sm:grid-cols-3">
          <p>
            <strong className="mb-1 block text-slate-200">Présences</strong>
            Présent / présent + absent sur les feuilles de match. Les présences
            incertaines ou non renseignées ne baissent pas le taux. « — »
            signifie qu’aucune présence n’est renseignée.
          </p>
          <p>
            <strong className="mb-1 block text-slate-200">Matchs joués</strong>
            Le joueur était présent et titulaire, ou est entré en jeu. Rester
            sur le banc ne compte pas comme un match joué.
          </p>
          <p>
            <strong className="mb-1 block text-slate-200">Période</strong>Seuls
            les matchs terminés à ce jour sont pris en compte. La saison débute
            le 1er juillet. Les actions facultatives sont comptées uniquement si
            elles ont été saisies.
          </p>
        </div>
      </details>

      {dialog?.type === "details" && (
        <PlayerDetailModal
          player={dialog.player}
          periodLabel={PERIODS[period]}
          onClose={close}
          onEdit={() => setDialog({ type: "edit", player: dialog.player })}
          onArchive={() =>
            setDialog({ type: "archive", player: dialog.player })
          }
        />
      )}
      {(dialog?.type === "create" || dialog?.type === "edit") && (
        <PlayerForm
          key={dialog.type === "edit" ? dialog.player.id : "create"}
          teamId={team.id}
          teamName={team.name}
          player={dialog.type === "edit" ? dialog.player : undefined}
          onClose={close}
          onSaved={(player) =>
            saved(
              `${player.first_name} ${player.last_name} : fiche enregistrée.`,
              player.status === "RETIRED" ? "RETIRED" : "CURRENT",
            )
          }
        />
      )}
      {dialog?.type === "archive" && (
        <ArchivePlayerDialog
          player={dialog.player}
          onClose={close}
          onArchived={() =>
            saved(
              `${dialog.player.first_name} ${dialog.player.last_name} a été archivé. Son historique est conservé.`,
            )
          }
        />
      )}
    </div>
  );
}
