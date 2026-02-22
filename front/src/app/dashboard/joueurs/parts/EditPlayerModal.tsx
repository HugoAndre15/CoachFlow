'use client';

import { useState, useEffect } from 'react';
import { X, UserCog } from 'lucide-react';
import { playerService, Player, PlayerPosition, PlayerStrongFoot, PlayerStatus } from '@/services/playerService';

interface EditPlayerModalProps {
  isOpen: boolean;
  player: Player | null;
  onClose: () => void;
  onSuccess: (updatedPlayer: Player) => void;
}

const POSITIONS: { value: PlayerPosition; label: string }[] = [
  { value: 'GOALKEEPER', label: 'Gardien' },
  { value: 'DEFENDER',   label: 'Défenseur' },
  { value: 'MIDFIELDER', label: 'Milieu' },
  { value: 'FORWARD',    label: 'Attaquant' },
];

const STRONG_FEET: { value: PlayerStrongFoot; label: string }[] = [
  { value: 'RIGHT', label: 'Pied droit' },
  { value: 'LEFT',  label: 'Pied gauche' },
  { value: 'BOTH',  label: 'Les deux' },
];

const STATUSES: { value: PlayerStatus; label: string }[] = [
  { value: 'ACTIVE',    label: 'Actif' },
  { value: 'INJURED',   label: 'Blessé' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'RETIRED',   label: 'Retraité' },
];

export default function EditPlayerModal({ isOpen, player, onClose, onSuccess }: EditPlayerModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [position, setPosition]   = useState<PlayerPosition | ''>('');
  const [strongFoot, setStrongFoot] = useState<PlayerStrongFoot | ''>('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [status, setStatus] = useState<PlayerStatus>('ACTIVE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form when player changes
  useEffect(() => {
    if (player) {
      setFirstName(player.first_name);
      setLastName(player.last_name);
      setPosition(player.position ?? '');
      setStrongFoot(player.strong_foot ?? '');
      setJerseyNumber(player.jersey_number?.toString() ?? '');
      setStatus(player.status ?? 'ACTIVE');
      setError(null);
    }
  }, [player]);

  const handleClose = () => {
    if (!isLoading) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    if (!firstName.trim() || !lastName.trim()) {
      setError('Le prénom et le nom sont obligatoires');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updated = await playerService.updatePlayer(player.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        position: position || undefined,
        strong_foot: strongFoot || undefined,
        jersey_number: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
        status,
      });
      onSuccess(updated);
    } catch (err: any) {
      console.error('Error updating player:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du joueur');
      setIsLoading(false);
    }
  };

  if (!isOpen || !player) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral hover:text-dark dark:hover:text-white hover:bg-dark-light/10 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-11 h-11 bg-accent-blue/10 dark:bg-accent-blue/20 rounded-xl flex items-center justify-center mb-4">
            <UserCog className="w-5 h-5 text-accent-blue" />
          </div>
          <h2 className="text-xl font-bold text-dark dark:text-white">Modifier le joueur</h2>
          <p className="text-sm text-dark-light/70 dark:text-neutral mt-1">
            {player.first_name} {player.last_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark dark:text-neutral mb-1.5">
                Prénom *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                disabled={isLoading}
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-sm text-dark dark:text-white placeholder-dark-light/40 dark:placeholder-neutral/40 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue disabled:opacity-50 transition-colors"
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
                disabled={isLoading}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-sm text-dark dark:text-white placeholder-dark-light/40 dark:placeholder-neutral/40 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue disabled:opacity-50 transition-colors"
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
              className="w-full px-3 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue disabled:opacity-50 transition-colors"
            >
              <option value="">— Non défini —</option>
              {POSITIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* N° maillot + Pied fort */}
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
                className="w-full px-3 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-sm text-dark dark:text-white placeholder-dark-light/40 dark:placeholder-neutral/40 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue disabled:opacity-50 transition-colors"
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
                className="w-full px-3 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue disabled:opacity-50 transition-colors"
              >
                <option value="">—</option>
                {STRONG_FEET.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-xs font-medium text-dark dark:text-neutral mb-1.5">
              Statut
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as PlayerStatus)}
              disabled={isLoading}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light bg-white dark:bg-dark text-sm text-dark dark:text-white focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue disabled:opacity-50 transition-colors"
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-neutral/30 dark:border-dark-light text-dark-light dark:text-neutral hover:bg-neutral/5 dark:hover:bg-dark-light/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !firstName.trim() || !lastName.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
