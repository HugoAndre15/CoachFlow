import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import type { PlayerOverview, PlayerStatus } from "@/services/playerService";
import {
  POSITIONS,
  STATUSES,
  type RosterFilters,
  type SortKey,
} from "./roster";

const statusColors: Record<PlayerStatus, string> = {
  ACTIVE: "text-emerald-300",
  INJURED: "text-rose-300",
  SUSPENDED: "text-amber-300",
  RETIRED: "text-slate-400",
};

export function PlayerStatusBadge({ status }: { status: PlayerStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${statusColors[status]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {STATUSES[status]}
    </span>
  );
}

export function Jersey({ number }: { number?: number | null }) {
  return (
    <span
      aria-label={number == null ? "Numéro non renseigné" : `Numéro ${number}`}
      className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] font-mono text-base font-medium tabular-nums text-slate-300"
    >
      {number ?? "—"}
    </span>
  );
}

export function Attendance({
  player,
  compact = false,
}: {
  player: PlayerOverview;
  compact?: boolean;
}) {
  const { present, recorded, rate } = player.stats.attendance;
  return (
    <span className={compact ? "block" : "mx-auto block w-24"}>
      <span
        className="tabular-nums text-slate-200"
        aria-label={
          recorded
            ? `${present} présences sur ${recorded} présences renseignées, ${rate} pour cent`
            : "Aucune présence renseignée"
        }
      >
        {recorded ? (
          <>
            {present}
            <span className="text-slate-400"> / {recorded}</span>
          </>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </span>
      {!compact && (
        <span
          aria-hidden="true"
          className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/10"
        >
          <span
            className="block h-full rounded-full bg-accent-green/80"
            style={{ width: `${rate ?? 0}%` }}
          />
        </span>
      )}
    </span>
  );
}

const columns: { key: SortKey; label: string; hint?: string }[] = [
  {
    key: "attendance",
    label: "Présences",
    hint: "Présent / présences renseignées",
  },
  { key: "played", label: "Joués", hint: "Matchs réellement joués" },
  { key: "starts", label: "Titularisations" },
  { key: "goals", label: "Buts" },
  { key: "assists", label: "Passes D.", hint: "Passes décisives" },
];

function SortHeading({
  label,
  sortKey,
  filters,
  onSort,
  hint,
}: {
  label: string;
  sortKey: SortKey;
  filters: RosterFilters;
  onSort: (key: SortKey) => void;
  hint?: string;
}) {
  const active = filters.sort === sortKey;
  const Icon = active
    ? filters.direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;
  return (
    <th
      scope="col"
      aria-sort={
        active
          ? filters.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className="px-2 font-medium"
    >
      <button
        onClick={() => onSort(sortKey)}
        title={hint}
        aria-label={`Trier par ${hint ?? label}`}
        className={`inline-flex min-h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded px-1 text-xs focus-visible:outline-2 focus-visible:outline-accent-green ${active ? "text-accent-green" : "text-slate-400 hover:text-white"}`}
      >
        {label}
        <Icon size={12} aria-hidden="true" />
      </button>
    </th>
  );
}

export default function PlayerTable({
  players,
  filters,
  onSort,
  onOpen,
}: {
  players: PlayerOverview[];
  filters: RosterFilters;
  onSort: (key: SortKey) => void;
  onOpen: (player: PlayerOverview) => void;
}) {
  return (
    <>
      <div
        className="hidden overflow-x-auto md:block"
        role="region"
        aria-label="Tableau des joueurs, défilement horizontal si nécessaire"
        tabIndex={0}
      >
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <caption className="sr-only">
            Effectif et statistiques des matchs terminés. Ouvrez le nom du
            joueur pour consulter sa fiche.
          </caption>
          <thead className="border-y border-white/10 bg-dark">
            <tr>
              <th
                scope="col"
                aria-sort={
                  filters.sort === "name"
                    ? filters.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="sticky left-0 z-10 bg-dark px-5 text-left"
              >
                <button
                  onClick={() => onSort("name")}
                  className="min-h-12 text-xs font-medium text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-accent-green"
                >
                  Joueur{" "}
                  <ArrowUpDown
                    className="ml-1 inline"
                    size={12}
                    aria-hidden="true"
                  />
                </button>
              </th>
              <th
                scope="col"
                className="px-3 text-left text-xs font-medium text-slate-400"
              >
                Disponibilité
              </th>
              {columns.map((c) => (
                <SortHeading
                  key={c.key}
                  label={c.label}
                  sortKey={c.key}
                  filters={filters}
                  onSort={onSort}
                  hint={c.hint}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {players.map((p) => (
              <tr
                key={p.id}
                className="group hover:bg-white/[0.025] focus-within:bg-white/[0.025]"
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 w-[260px] min-w-[220px] bg-dark-secondary px-4 text-left font-normal"
                >
                  <button
                    onClick={() => onOpen(p)}
                    aria-label={`Ouvrir la fiche de ${p.first_name} ${p.last_name}`}
                    className="flex w-full items-center gap-3 rounded-lg py-3.5 pr-2 text-left focus-visible:outline-2 focus-visible:outline-accent-green"
                  >
                    <Jersey number={p.jersey_number} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block max-w-52 truncate font-medium text-white group-hover:text-emerald-300"
                        title={`${p.first_name} ${p.last_name}`}
                      >
                        {p.first_name} {p.last_name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-400">
                        {POSITIONS[p.position ?? ""] ?? "Poste à renseigner"}
                      </span>
                    </span>
                    <ChevronRight
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-slate-600 group-hover:text-accent-green"
                    />
                  </button>
                </th>
                <td className="px-3">
                  <PlayerStatusBadge status={p.status} />
                </td>
                <td className="px-2 text-center">
                  <Attendance player={p} />
                </td>
                <td className="px-2 text-center tabular-nums text-slate-200">
                  {p.stats.total_matches}
                </td>
                <td className="px-2 text-center tabular-nums text-slate-400">
                  {p.stats.matches_as_starter}
                </td>
                <td
                  className={`px-2 text-center font-semibold tabular-nums ${p.stats.goals ? "text-emerald-300" : "text-slate-400"}`}
                >
                  {p.stats.goals}
                </td>
                <td
                  className={`px-2 text-center tabular-nums ${p.stats.assists ? "text-white" : "text-slate-400"}`}
                >
                  {p.stats.assists}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul
        className="divide-y divide-white/10 border-t border-white/10 md:hidden"
        aria-label="Liste des joueurs"
      >
        {players.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onOpen(p)}
              className="block w-full p-4 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-green"
            >
              <span className="sr-only">Ouvrir la fiche : </span>
              <span className="flex items-center gap-3">
                <Jersey number={p.jersey_number} />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium text-white">
                    {p.first_name} {p.last_name}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-xs text-slate-400">
                      {POSITIONS[p.position ?? ""] ?? "Poste à renseigner"}
                    </span>
                    <PlayerStatusBadge status={p.status} />
                  </span>
                </span>
                <ChevronRight
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-slate-400"
                />
              </span>
              <span className="mt-4 grid grid-cols-4 gap-1 border-t border-white/[0.06] pt-3 text-center">
                <span>
                  <span className="mb-1 block text-[11px] text-slate-400">
                    Présences
                  </span>
                  <span className="text-sm">
                    <Attendance player={p} compact />
                  </span>
                </span>
                <span>
                  <span className="mb-1 block text-[11px] text-slate-400">
                    Joués
                  </span>
                  <span className="text-sm tabular-nums text-slate-200">
                    {p.stats.total_matches}
                  </span>
                </span>
                <span>
                  <span className="mb-1 block text-[11px] text-slate-400">
                    Buts
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-emerald-300">
                    {p.stats.goals}
                  </span>
                </span>
                <span>
                  <span className="mb-1 block text-[11px] text-slate-400">
                    Passes D.
                  </span>
                  <span className="text-sm tabular-nums text-slate-200">
                    {p.stats.assists}
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
