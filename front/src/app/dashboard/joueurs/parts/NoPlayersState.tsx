import { Plus, Shield } from 'lucide-react';

interface NoPlayersStateProps {
  hasFilters: boolean;
  onAdd: () => void;
}

export default function NoPlayersState({ hasFilters, onAdd }: NoPlayersStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Shield className="w-10 h-10 text-neutral mb-3" />
      <p className="text-dark dark:text-white font-medium">Aucun joueur trouvé</p>
      <p className="text-sm text-dark-light/50 dark:text-neutral/50 mt-1 mb-4">
        {hasFilters ? 'Aucun joueur ne correspond aux filtres' : 'Ajoutez votre premier joueur'}
      </p>
      {!hasFilters && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-accent-green text-white rounded-xl text-sm font-semibold hover:bg-accent-green/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Ajouter un joueur
        </button>
      )}
    </div>
  );
}
