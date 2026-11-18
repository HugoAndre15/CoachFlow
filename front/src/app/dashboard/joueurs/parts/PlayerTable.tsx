import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import type { PlayerOverview, PlayerStatus } from "@/services/playerService";
import {
  POSITIONS,
  STATUSES,
  type RosterFilters,
  type SortKey,
} from "./roster";

const statusColors: Record<PlayerStatus, string> = {
  ACTIVE: "text-accent-green",
  INJURED: "text-accent-red",
  SUSPENDED: "text-warning",
  RETIRED: "text-muted",
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
      className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-subtle font-mono text-base font-medium tabular-nums text-muted"
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
        className="tabular-nums text-ink"
        aria-label={
          recorded
            ? `${present} présences sur ${recorded} présences renseignées, ${rate} pour cent`
            : "Aucune présence renseignée"
        }
      >
        {recorded ? (
          <>
            {present}
            <span className="text-muted"> / {recorded}</span>
          </>
        ) : (
          <span className="text-muted">—</span>
        )}
      </span>
      {!compact && (
        <span
          aria-hidden="true"
          className="mt-1.5 block h-1 overflow-hidden rounded-full bg-subtle"
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
        className={`inline-flex min-h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded px-1 text-xs focus-visible:outline-2 focus-visible:outline-accent-green ${active ? "text-accent-green" : "text-muted hover:text-ink"}`}
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
          <thead className="border-y border-line bg-subtle">
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
                className="sticky left-0 z-10 bg-surface px-5 text-left"
              >
                <button
                  onClick={() => onSort("name")}
                  className="min-h-12 text-xs font-medium text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-green"
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
                className="px-3 text-left text-xs font-medium text-muted"
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
          <tbody className="divide-y divide-line">
            {players.map((p) => (
              <tr
                key={p.id}
                className="group hover:bg-subtle focus-within:bg-subtle"
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 w-[260px] min-w-[220px] bg-surface px-4 text-left font-normal"
                >
                  <button
                    onClick={() => onOpen(p)}
                    aria-label={`Ouvrir la fiche de ${p.first_name} ${p.last_name}`}
                    className="flex w-full items-center gap-3 rounded-lg py-3.5 pr-2 text-left focus-visible:outline-2 focus-visible:outline-accent-green"
                  >
                    <Jersey number={p.jersey_number} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block max-w-52 truncate font-medium text-ink group-hover:text-accent-green"
                        title={`${p.first_name} ${p.last_name}`}
                      >
                        {p.first_name} {p.last_name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {POSITIONS[p.position ?? ""] ?? "Poste à renseigner"}
                      </span>
                    </span>
                    <ChevronRight
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-muted group-hover:text-accent-green"
                    />
                  </button>
                </th>
                <td className="px-3">
                  <PlayerStatusBadge status={p.status} />
                </td>
                <td className="px-2 text-center">
                  <Attendance player={p} />
                </td>
                <td className="px-2 text-center tabular-nums text-ink">
                  {p.stats.total_matches}
                </td>
                <td className="px-2 text-center tabular-nums text-muted">
                  {p.stats.matches_as_starter}
                </td>
                <td
                  className={`px-2 text-center font-semibold tabular-nums ${p.stats.goals ? "text-accent-green" : "text-muted"}`}
                >
                  {p.stats.goals}
                </td>
                <td
                  className={`px-2 text-center tabular-nums ${p.stats.assists ? "text-ink" : "text-muted"}`}
                >
                  {p.stats.assists}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul
        className="divide-y divide-line border-t border-line md:hidden"
        aria-label="Liste des joueurs"
      >
        {players.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onOpen(p)}
              className="block w-full p-4 text-left transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-green"
            >
              <span className="sr-only">Ouvrir la fiche : </span>
              <span className="flex items-center gap-3">
                <Jersey number={p.jersey_number} />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium text-ink">
                    {p.first_name} {p.last_name}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-xs text-muted">
                      {POSITIONS[p.position ?? ""] ?? "Poste à renseigner"}
                    </span>
                    <PlayerStatusBadge status={p.status} />
                  </span>
                </span>
                <ChevronRight
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-muted"
                />
              </span>
              <span className="mt-4 grid grid-cols-4 gap-1 border-t border-line pt-3 text-center">
                <span>
                  <span className="mb-1 block text-[11px] text-muted">
                    Présences
                  </span>
                  <span className="text-sm">
                    <Attendance player={p} compact />
                  </span>
                </span>
                <span>
                  <span className="mb-1 block text-[11px] text-muted">
                    Joués
                  </span>
                  <span className="text-sm tabular-nums text-ink">
                    {p.stats.total_matches}
                  </span>
                </span>
                <span>
                  <span className="mb-1 block text-[11px] text-muted">
                    Buts
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-accent-green">
                    {p.stats.goals}
                  </span>
                </span>
                <span>
                  <span className="mb-1 block text-[11px] text-muted">
                    Passes D.
                  </span>
                  <span className="text-sm tabular-nums text-ink">
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
