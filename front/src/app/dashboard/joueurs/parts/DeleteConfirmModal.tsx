import { Archive } from 'lucide-react';

interface DeleteConfirmModalProps {
  playerId: string;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

export default function DeleteConfirmModal({ playerId, onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white dark:bg-dark-secondary rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-start gap-4 p-6">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center flex-shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-dark dark:text-white mb-1">Retirer ce joueur de l’effectif ?</h3>
            <p className="text-sm text-dark-light/70 dark:text-grey-medium leading-relaxed">
              Le joueur sera archivé. Ses matchs et ses statistiques resteront conservés.
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-dark-light/20 dark:border-dark-light rounded-xl text-sm font-medium text-dark-light dark:text-grey-medium hover:bg-dark-light/5 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(playerId)}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            Archiver
          </button>
        </div>
      </div>
    </div>
  );
}
