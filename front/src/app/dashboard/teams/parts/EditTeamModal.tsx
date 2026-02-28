'use client';

import { useState, useEffect } from 'react';
import { Pencil, X } from 'lucide-react';
import { teamService, Team } from '@/services/teamService';

const CATEGORIES = [
  'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15',
  'U16', 'U17', 'U18', 'U19', 'U20', 'U21', 'Séniors', 'Vétérans', 'Féminine',
];

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  team: Team;
}

export default function EditTeamModal({ isOpen, onClose, onSuccess, team }: EditTeamModalProps) {
  const [name, setName] = useState(team.name);
  const [category, setCategory] = useState(team.category);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(team.name);
      setCategory(team.category);
      setError(null);
    }
  }, [isOpen, team]);

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
      await teamService.updateTeam(team.id, { name: name.trim(), category });
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error('Error updating team:', err);
      setError(err.response?.data?.message || "Erreur lors de la modification de l'équipe");
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
        {/* Close */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 dark:text-neutral hover:text-gray-600 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-11 h-11 bg-accent-blue/10 dark:bg-accent-blue/20 rounded-xl flex items-center justify-center mb-4">
            <Pencil className="w-5 h-5 text-accent-blue" />
          </div>
          <h2 className="text-xl font-bold text-dark dark:text-white">
            Modifier l&apos;équipe
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral mt-1">
            Modifiez les informations de votre équipe
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral mb-1.5">
              Nom de l&apos;équipe *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: U15 A, Équipe première..."
              disabled={isLoading}
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-light bg-white dark:bg-dark text-dark dark:text-white placeholder-gray-400 dark:placeholder-neutral/40 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral mb-1.5">
              Catégorie *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-dark-light bg-white dark:bg-dark text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent disabled:opacity-50 transition-colors"
            >
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-dark hover:bg-gray-200 dark:hover:bg-dark-light text-gray-700 dark:text-neutral text-sm font-medium transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || name.trim().length < 3 || !category}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Modification...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
