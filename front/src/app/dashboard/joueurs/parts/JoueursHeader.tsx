import { Plus, RefreshCw } from 'lucide-react';
import { Team } from '@/services/teamService';

interface JoueursHeaderProps {
  activeTeam: Team | null;
  isLoading: boolean;
  onRefresh: () => void;
  onAdd: () => void;
}

export default function JoueursHeader({ activeTeam, isLoading, onRefresh, onAdd }: JoueursHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-dark dark:text-white">Joueurs</h1>
        {activeTeam && (
          <p className="text-sm text-dark-light/70 dark:text-neutral mt-0.5">
            {activeTeam.name}
            {activeTeam.category && (
              <span className="ml-2 text-xs bg-neutral-lighter dark:bg-dark-light px-1.5 py-0.5 rounded">
                {activeTeam.category}
              </span>
            )}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {activeTeam && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center px-3 py-2 rounded-xl border border-neutral/20 dark:border-dark-light text-dark-light dark:text-neutral hover:border-accent-green/40 hover:text-accent-green transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
        <button
          onClick={onAdd}
          disabled={!activeTeam}
          className="flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-xl text-sm font-semibold hover:bg-accent-green/90 transition-all shadow-lg shadow-accent-green/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <Plus className="w-4 h-4" />
          Ajouter un joueur
        </button>
      </div>
    </div>
  );
}
