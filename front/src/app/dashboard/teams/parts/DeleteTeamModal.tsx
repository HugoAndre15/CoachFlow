'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { teamService } from '@/services/teamService';

interface DeleteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  teamId: string;
  teamName: string;
}

export default function DeleteTeamModal({ isOpen, onClose, onSuccess, teamId, teamName }: DeleteTeamModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await teamService.deleteTeam(teamId);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error('Error deleting team:', err);
      setError(err.response?.data?.message || "Erreur lors de la suppression de l'équipe");
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
      <div
        className="bg-white dark:bg-dark-lighter rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 dark:text-neutral hover:text-gray-600 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 bg-accent-red/10 dark:bg-accent-red/20 rounded-xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-accent-red" />
        </div>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-dark dark:text-white">
            Supprimer l&apos;équipe
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral mt-2">
            Êtes-vous sûr de vouloir supprimer l&apos;équipe{' '}
            <span className="font-semibold text-dark dark:text-white">{teamName}</span> ?
          </p>
          <p className="text-sm text-accent-red mt-3 font-medium">
            ⚠️ Cette action est irréversible. Tous les joueurs, matchs et statistiques liés seront supprimés.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-dark hover:bg-gray-200 dark:hover:bg-dark-light text-gray-700 dark:text-neutral rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
