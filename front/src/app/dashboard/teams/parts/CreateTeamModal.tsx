'use client';

import { useState } from 'react';
import RosterDialog from '../../joueurs/parts/RosterDialog';
import { teamService } from '@/services/teamService';

const CATEGORIES = [
  'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15',
  'U16', 'U17', 'U18', 'U19', 'U20', 'U21', 'Séniors', 'Vétérans', 'Féminine',
];

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  clubId: string;
}

export default function CreateTeamModal({ isOpen, onClose, onSuccess, clubId }: CreateTeamModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length < 3) {
      setError("Le nom de l'équipe doit contenir au moins 3 caractères");
      return;
    }
    if (!category) {
      setError('Veuillez sélectionner une catégorie');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await teamService.createTeam({ name: name.trim(), category, club_id: clubId });
      setName('');
      setCategory('');
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error('Error creating team:', err);
      setError(err.response?.data?.message || "Erreur lors de la création de l'équipe");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setCategory('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <RosterDialog title="Créer une équipe" onClose={handleClose} busy={isLoading}>
      <p className="mb-5 text-sm text-muted">Vous serez le coach de cette équipe.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-team-name" className="block text-sm font-medium text-dark dark:text-neutral mb-1.5">
              Nom de l'équipe *
            </label>
            <input
              id="new-team-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: U15 A, Équipe première..."
              disabled={isLoading}
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-dark dark:text-white placeholder-dark-light/40 dark:placeholder-neutral/40 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="new-team-category" className="block text-sm font-medium text-dark dark:text-neutral mb-1.5">
              Catégorie *
            </label>
            <select id="new-team-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-dark dark:text-white focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green disabled:opacity-50 transition-colors"
            >
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light text-dark-light dark:text-neutral hover:bg-neutral-lighter/50 dark:hover:bg-dark-light/50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim() || !category}
              className="flex-1 px-4 py-2.5 rounded-lg bg-action text-on-action text-sm font-medium hover:bg-action-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
    </RosterDialog>
  );
}
