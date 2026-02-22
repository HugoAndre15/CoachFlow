'use client';

import { useState, FormEvent, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users as UsersIcon } from 'lucide-react';
import { matchService, MatchLocation } from '@/services/matchService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
}

export default function CreateMatchModal({ isOpen, onClose, onSuccess, teamId }: Props) {
  const [opponent, setOpponent] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('15:00');
  const [location, setLocation] = useState<MatchLocation>('HOME');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setOpponent('');
      setMatchDate('');
      setMatchTime('15:00');
      setLocation('HOME');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!opponent.trim() || !matchDate) return;

    try {
      setIsSubmitting(true);
      setError('');
      const dateTime = new Date(`${matchDate}T${matchTime}:00`).toISOString();
      await matchService.createMatch({
        team_id: teamId,
        opponent: opponent.trim(),
        location,
        match_date: dateTime,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-lighter rounded-2xl w-full max-w-md shadow-2xl border border-neutral/20 dark:border-dark-light animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral/10 dark:border-dark-light">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-green/10 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5 text-accent-green" />
            </div>
            <h2 className="text-lg font-bold text-dark dark:text-white">Nouveau match</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-neutral/10 dark:hover:bg-dark-light flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-dark-light dark:text-neutral" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Adversaire */}
          <div>
            <label className="block text-xs font-semibold text-dark-light dark:text-neutral mb-1.5 uppercase tracking-wide">
              Adversaire
            </label>
            <div className="relative">
              <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-light/40 dark:text-neutral/40 pointer-events-none" />
              <input
                type="text"
                value={opponent}
                onChange={e => setOpponent(e.target.value)}
                placeholder="Ex: FC Barcelona"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-neutral-lighter/60 dark:bg-dark-secondary/40 border border-neutral/20 dark:border-dark-light text-dark dark:text-white placeholder:text-dark-light/40 dark:placeholder:text-neutral/40 rounded-xl text-sm outline-none focus:border-accent-green transition-colors"
              />
            </div>
          </div>

          {/* Date + Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark-light dark:text-neutral mb-1.5 uppercase tracking-wide">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-light/40 dark:text-neutral/40 pointer-events-none" />
                <input
                  type="date"
                  value={matchDate}
                  onChange={e => setMatchDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-lighter/60 dark:bg-dark-secondary/40 border border-neutral/20 dark:border-dark-light text-dark dark:text-white rounded-xl text-sm outline-none focus:border-accent-green transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-light dark:text-neutral mb-1.5 uppercase tracking-wide">
                Heure
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-light/40 dark:text-neutral/40 pointer-events-none" />
                <input
                  type="time"
                  value={matchTime}
                  onChange={e => setMatchTime(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-lighter/60 dark:bg-dark-secondary/40 border border-neutral/20 dark:border-dark-light text-dark dark:text-white rounded-xl text-sm outline-none focus:border-accent-green transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label className="block text-xs font-semibold text-dark-light dark:text-neutral mb-1.5 uppercase tracking-wide">
              Lieu
            </label>
            <div className="flex gap-2">
              {([['HOME', 'Domicile', '🏠'], ['AWAY', 'Extérieur', '✈️']] as [MatchLocation, string, string][]).map(
                ([val, label, emoji]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLocation(val)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                      location === val
                        ? 'bg-accent-green/10 border-accent-green text-accent-green shadow-sm'
                        : 'bg-neutral-lighter/60 dark:bg-dark-secondary/40 border-neutral/20 dark:border-dark-light text-dark-light dark:text-neutral hover:border-accent-green/40'
                    }`}
                  >
                    <span>{emoji}</span>
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-neutral/20 dark:border-dark-light text-dark-light dark:text-neutral hover:bg-neutral/10 dark:hover:bg-dark-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !opponent.trim() || !matchDate}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent-green text-white hover:bg-accent-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Création...' : 'Créer le match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
