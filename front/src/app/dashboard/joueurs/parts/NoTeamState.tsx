import { Users } from 'lucide-react';

export default function NoTeamState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-16 h-16 rounded-2xl bg-dark-lighter dark:bg-dark-light flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-neutral" />
      </div>
      <p className="text-dark dark:text-white font-semibold">Aucune équipe sélectionnée</p>
      <p className="text-sm text-dark-light/50 dark:text-neutral/50 mt-1">
        Sélectionnez une équipe dans la barre de navigation
      </p>
    </div>
  );
}
