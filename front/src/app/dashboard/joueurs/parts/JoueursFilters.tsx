import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import {
  buttonClass,
  fieldClass,
  POSITIONS,
  SORTS,
  STATUSES,
  type RosterFilters,
  type SortKey,
  type StatusFilter,
} from "./roster";

export default function JoueursFilters({
  filters,
  onChange,
}: {
  filters: RosterFilters;
  onChange: (filters: RosterFilters) => void;
}) {
  const update = (values: Partial<RosterFilters>) =>
    onChange({ ...filters, ...values });
  return (
    <div className="space-y-3 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(200px,1fr)_170px_180px]">
        <div className="relative col-span-2 lg:col-span-1">
          <label htmlFor="roster-search" className="sr-only">
            Rechercher un joueur par nom ou numéro
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
            size={17}
            aria-hidden="true"
          />
          <input
            id="roster-search"
            type="search"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Rechercher un joueur…"
            className={`${fieldClass} pl-10 pr-11 [&::-webkit-search-cancel-button]:appearance-none`}
          />
          {filters.search && (
            <button
              onClick={() => update({ search: "" })}
              aria-label="Effacer la recherche"
              className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-accent-green"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        <div>
          <label htmlFor="roster-position" className="sr-only">
            Filtrer par poste
          </label>
          <select
            id="roster-position"
            value={filters.position}
            onChange={(e) => update({ position: e.target.value })}
            className={`${fieldClass} sm:text-sm`}
          >
            <option value="">Tous les postes</option>
            {Object.entries(POSITIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="roster-status" className="sr-only">
            Filtrer par disponibilité
          </label>
          <select
            id="roster-status"
            value={filters.status}
            onChange={(e) => update({ status: e.target.value as StatusFilter })}
            className={`${fieldClass} sm:text-sm`}
          >
            <option value="CURRENT">Effectif actuel</option>
            {Object.entries(STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label htmlFor="roster-sort" className="mr-1 text-slate-400">
          Trier par
        </label>
        <select
          id="roster-sort"
          value={filters.sort}
          onChange={(e) => {
            const sort = e.target.value as SortKey;
            update({
              sort,
              direction: sort === "name" || sort === "number" ? "asc" : "desc",
            });
          }}
          className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-dark px-3 text-base text-slate-200 sm:text-sm focus-visible:outline-2 focus-visible:outline-accent-green"
        >
          {Object.entries(SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            update({ direction: filters.direction === "asc" ? "desc" : "asc" })
          }
          className={`${buttonClass} px-3`}
          aria-label={`Ordre ${filters.direction === "asc" ? "croissant" : "décroissant"}, inverser le tri`}
          title="Inverser le tri"
        >
          {filters.direction === "asc" ? (
            <ArrowUp size={16} aria-hidden="true" />
          ) : (
            <ArrowDown size={16} aria-hidden="true" />
          )}
        </button>
        {(filters.search ||
          filters.position ||
          filters.status !== "CURRENT") && (
          <button
            onClick={() =>
              update({ search: "", position: "", status: "CURRENT" })
            }
            className="min-h-11 rounded-lg px-2 text-sm text-accent-green hover:underline focus-visible:outline-2 focus-visible:outline-accent-green"
          >
            Effacer les filtres
          </button>
        )}
      </div>
    </div>
  );
}
