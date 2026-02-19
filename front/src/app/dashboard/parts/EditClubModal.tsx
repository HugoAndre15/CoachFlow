'use client';

import { useState, useEffect } from 'react';
import { clubService } from '@/services/clubService';
import { X } from 'lucide-react';

interface EditClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  clubId: string;
  currentName: string;
}

export default function EditClubModal({ isOpen, onClose, onSuccess, clubId, currentName }: EditClubModalProps) {
  const [clubName, setClubName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setClubName(currentName);
      setError(null);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (clubName.trim().length < 3) {
      setError('Le nom du club doit contenir au moins 3 caractères');
      return;
    }

    if (clubName.trim() === currentName) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await clubService.updateClub(clubId, clubName.trim());
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error updating club:', err);
      setError(err.response?.data?.message || 'Erreur lors de la modification du club');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setClubName(currentName);
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

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-dark dark:text-neutral-lightest">
            Modifier le club
          </h2>
          <p className="text-grey-medium dark:text-grey-light mt-2 text-sm">
            Changez le nom de votre club
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="clubName" className="block text-sm font-medium text-dark dark:text-neutral-lightest mb-2">
              Nom du club *
            </label>
            <input
              id="clubName"
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Ex: FC Paris, AS Lyon..."
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg border border-grey-light/20 dark:border-dark-light bg-white dark:bg-dark text-dark dark:text-neutral-lightest placeholder-grey-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
            <p className="text-xs text-grey-medium dark:text-grey-light mt-2">
              Minimum 3 caractères
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
              type="submit"
              disabled={isLoading || clubName.trim().length < 3}
              className="flex-1 px-4 py-3 bg-accent-green text-white rounded-lg font-medium hover:bg-accent-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Modification...</span>
                </>
              ) : (
                <span>Modifier</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
