'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { playerService, PlayerPosition, PlayerStrongFoot } from '@/services/playerService';

interface CreatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  teamId: string;
}

const POSITIONS: { value: PlayerPosition; label: string }[] = [
  { value: 'GOALKEEPER', label: 'Gardien' },
  { value: 'DEFENDER', label: 'Défenseur' },
  { value: 'MIDFIELDER', label: 'Milieu' },
  { value: 'FORWARD', label: 'Attaquant' },
];

const STRONG_FEET: { value: PlayerStrongFoot; label: string }[] = [
  { value: 'RIGHT', label: 'Droit' },
  { value: 'LEFT', label: 'Gauche' },
  { value: 'BOTH', label: 'Les deux' },
];

export default function CreatePlayerModal({ isOpen, onClose, onSuccess, teamId }: CreatePlayerModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState<PlayerPosition | ''>('');
  const [strongFoot, setStrongFoot] = useState<PlayerStrongFoot | ''>('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError('Le prénom et le nom sont obligatoires');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await playerService.createPlayer({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        team_id: teamId,
        position: position || undefined,
        strong_foot: strongFoot || undefined,
        jersey_number: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
      });
      resetForm();
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error('Error creating player:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du joueur');
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPosition('');
    setStrongFoot('');
    setJerseyNumber('');
    setError(null);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-dark-light/50 hover:text-dark dark:hover:text-white transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-11 h-11 bg-accent-green/10 dark:bg-accent-green/20 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-accent-green" />
          </div>
          <h2 className="text-xl font-bold text-dark dark:text-white">Ajouter un joueur</h2>
          <p className="text-sm text-dark-light/70 dark:text-neutral mt-1">
            Le joueur sera ajouté à l'équipe sélectionnée
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom / Prénom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark dark:text-neutral mb-1.5">
                Prénom *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Kylian"
                disabled={isLoading}
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-sm text-dark dark:text-white placeholder-dark-light/40 dark:placeholder-neutral/40 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green disabled:opacity-50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark dark:text-neutral mb-1.5">
                Nom *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Mbappé"
                disabled={isLoading}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-sm text-dark dark:text-white placeholder-dark-light/40 dark:placeholder-neutral/40 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green disabled:opacity-50 transition-colors"
              />
            </div>
          </div>

          {/* Poste */}
          <div>
            <label className="block text-xs font-medium text-dark dark:text-neutral mb-1.5">
              Poste
            </label>
            <select
              value={position}
              onChange={e => setPosition(e.target.value as PlayerPosition | '')}
              disabled={isLoading}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green disabled:opacity-50 transition-colors"
            >
              <option value="">— Non défini —</option>
              {POSITIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Numéro de maillot + Pied fort */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark dark:text-neutral mb-1.5">
                N° maillot
              </label>
              <input
                type="number"
                value={jerseyNumber}
                onChange={e => setJerseyNumber(e.target.value)}
                placeholder="10"
                min={1}
                max={99}
                disabled={isLoading}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-sm text-dark dark:text-white placeholder-dark-light/40 dark:placeholder-neutral/40 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green disabled:opacity-50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark dark:text-neutral mb-1.5">
                Pied fort
              </label>
              <select
                value={strongFoot}
                onChange={e => setStrongFoot(e.target.value as PlayerStrongFoot | '')}
                disabled={isLoading}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green disabled:opacity-50 transition-colors"
              >
                <option value="">—</option>
                {STRONG_FEET.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
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
              disabled={isLoading || !firstName.trim() || !lastName.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-green text-white text-sm font-medium hover:bg-accent-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
