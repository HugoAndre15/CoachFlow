'use client';

import { useState } from 'react';
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-lightest transition-colors disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 bg-accent-green/10 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-lightest">
            Créer un nouveau club
          </h2>
          <p className="text-gray-600 dark:text-neutral mt-2">
            Vous serez automatiquement désigné comme président du club
          </p>
        </div>

        {/* Form */}
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
              className="flex-1 px-4 py-3 bg-accent-green hover:bg-accent-green/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}
