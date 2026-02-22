import { Search } from 'lucide-react';
import { POSITION_TABS } from './constants';

interface JoueursFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  positionFilter: string;
  onPositionChange: (value: string) => void;
  filteredCount: number;
}

export default function JoueursFilters({
  search,
  onSearchChange,
  positionFilter,
  onPositionChange,
  filteredCount,
}: JoueursFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral/50" />
        <input
          type="text"
          placeholder="Rechercher un joueur..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white/60 dark:bg-dark-lighter/60 backdrop-blur-sm border border-neutral/20 dark:border-dark-light rounded-xl text-dark dark:text-white placeholder:text-neutral/40 outline-none focus:border-accent-green/50 transition-colors"
        />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {POSITION_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => onPositionChange(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              positionFilter === tab.key
                ? 'bg-accent-green text-white shadow-sm shadow-accent-green/30'
                : 'bg-white/40 dark:bg-dark-lighter/40 text-dark-light dark:text-neutral hover:bg-accent-green/10 hover:text-accent-green border border-neutral/15 dark:border-dark-light'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <span className="ml-auto text-sm text-dark-light/60 dark:text-neutral/60 hidden sm:block shrink-0">
        <span className="font-semibold text-dark dark:text-white">{filteredCount}</span> joueur{filteredCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
