'use client';

import { useState } from 'react';
import RosterDialog from '../../joueurs/parts/RosterDialog';
import { clubService } from '@/services/clubService';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateClubModal({ isOpen, onClose, onSuccess }: CreateClubModalProps) {
  const [clubName, setClubName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (clubName.trim().length < 3) {
      setError('Le nom du club doit contenir au moins 3 caractères');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await clubService.createClub(clubName.trim());
      setClubName('');
      onClose();
      // Appeler la fonction de callback pour rafraîchir les clubs
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error creating club:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du club');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setClubName('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <RosterDialog title="Créer un nouveau club" onClose={handleClose} busy={isLoading}>
      <p className="mb-5 text-sm text-muted">Vous serez président de ce club dans CoachFlow.</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="clubName" className="block text-sm font-medium text-gray-700 dark:text-neutral mb-2">
              Nom du club *
            </label>
            <input
              id="clubName"
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Ex: FC Paris, AS Lyon..."
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-light bg-white dark:bg-dark text-gray-900 dark:text-neutral-lightest placeholder-gray-400 dark:placeholder-neutral focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-neutral mt-2">
              Minimum 3 caractères
            </p>
          </div>

          {/* Error message */}
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
              type="submit"
              disabled={isLoading || clubName.trim().length < 3}
              className="flex-1 px-4 py-3 bg-action hover:bg-action-hover text-on-action rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Création...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Créer le club
                </>
              )}
            </button>
          </div>
        </form>
    </RosterDialog>
  );
}
