'use client';

import { useState } from 'react';
import { clubService } from '@/services/clubService';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  clubId: string;
  clubName: string;
}

export default function DeleteClubModal({ isOpen, onClose, onSuccess, clubId, clubName }: DeleteClubModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await clubService.deleteClub(clubId);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error deleting club:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression du club');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-grey-medium hover:text-dark dark:hover:text-neutral-lightest transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 bg-accent-red/10 rounded-lg flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-accent-red" />
        </div>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-dark dark:text-neutral-lightest">
            Supprimer le club
          </h2>
          <p className="text-grey-medium dark:text-grey-light mt-2 text-sm">
            Êtes-vous sûr de vouloir supprimer le club <span className="font-semibold text-dark dark:text-neutral-lightest">{clubName}</span> ?
          </p>
          <p className="text-accent-red text-sm mt-3 font-medium">
            ⚠️ Cette action est irréversible et supprimera toutes les équipes et données associées.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg">
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-grey-light/10 dark:bg-dark-light text-dark dark:text-neutral-lightest rounded-lg font-medium hover:bg-grey-light/20 dark:hover:bg-dark-lighter transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-accent-red text-white rounded-lg font-medium hover:bg-accent-red/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Suppression...</span>
              </>
            ) : (
              <span>Supprimer</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
