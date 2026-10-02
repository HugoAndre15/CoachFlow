import type {
  PlayerOverview,
  PlayerStatsPeriod,
  PlayerStatus,
} from "@/services/playerService";

export const POSITIONS: Record<string, string> = {
  GOALKEEPER: "Gardien",
  DEFENDER: "Défenseur",
  MIDFIELDER: "Milieu",
  FORWARD: "Attaquant",
};
export const FEET: Record<string, string> = {
  RIGHT: "Droit",
  LEFT: "Gauche",
  BOTH: "Les deux",
};
export const STATUSES: Record<PlayerStatus, string> = {
  ACTIVE: "Disponible",
  INJURED: "Blessé",
  SUSPENDED: "Suspendu",
  RETIRED: "Archivé",
};
export const PERIODS: Record<PlayerStatsPeriod, string> = {
  ALL: "Tous les matchs",
  SEASON: "Cette saison",
  LAST_30_DAYS: "30 derniers jours",
};
export const SORTS = {
  name: "Nom",
  number: "N° de maillot",
  attendance: "Taux de présence",
  played: "Matchs joués",
  starts: "Titularisations",
  goals: "Buts",
  assists: "Passes décisives",
};
export type SortKey = keyof typeof SORTS;
export type StatusFilter = "CURRENT" | PlayerStatus;
export interface RosterFilters {
  search: string;
  position: string;
  status: StatusFilter;
  sort: SortKey;
  direction: "asc" | "desc";
}
export const DEFAULT_FILTERS: RosterFilters = {
  search: "",
  position: "",
  status: "CURRENT",
  sort: "name",
  direction: "asc",
};

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
const compareNames = (a: PlayerOverview, b: PlayerOverview) =>
  `${a.last_name} ${a.first_name}`.localeCompare(
    `${b.last_name} ${b.first_name}`,
    "fr",
    { sensitivity: "base" },
  );

export function filterAndSortPlayers(
  players: PlayerOverview[],
  filters: RosterFilters,
): PlayerOverview[] {
  const terms = normalize(filters.search).split(/\s+/).filter(Boolean);
  const getValue = (p: PlayerOverview): number | null => {
    switch (filters.sort) {
      case "number":
        return p.jersey_number ?? null;
      case "attendance":
        return p.stats.attendance.rate;
      case "played":
        return p.stats.total_matches;
      case "starts":
        return p.stats.matches_as_starter;
      case "goals":
        return p.stats.goals;
      case "assists":
        return p.stats.assists;
      default:
        return null;
    }
  };
  return players
    .filter((p) => {
      if (
        filters.status === "CURRENT"
          ? p.status === "RETIRED"
          : p.status !== filters.status
      )
        return false;
      if (filters.position && p.position !== filters.position) return false;
      const identity = normalize(
        `${p.first_name} ${p.last_name} ${p.jersey_number ?? ""}`,
      );
      return terms.every((term) => identity.includes(term));
    })
    .sort((a, b) => {
      if (filters.sort === "name")
        return compareNames(a, b) * (filters.direction === "asc" ? 1 : -1);
      const av = getValue(a),
        bv = getValue(b);
      // Missing data stays last in either direction; zero is a real measurement.
      if (av === null || bv === null)
        return av === bv ? compareNames(a, b) : av === null ? 1 : -1;
      return (
        (av - bv) * (filters.direction === "asc" ? 1 : -1) || compareNames(a, b)
      );
    });
}

export function requestError(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  return typeof message === "string" ? message : fallback;
}

export const fieldClass =
  "min-h-11 w-full rounded-lg border border-white/15 bg-dark px-3 py-2 text-base text-white outline-none placeholder:text-slate-500 focus:border-accent-green focus:ring-2 focus:ring-accent-green/25 disabled:opacity-50";
export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green disabled:cursor-wait disabled:opacity-50";
export const primaryClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent-green px-4 py-2 text-sm font-semibold text-dark transition-colors hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green disabled:cursor-wait disabled:opacity-50";
