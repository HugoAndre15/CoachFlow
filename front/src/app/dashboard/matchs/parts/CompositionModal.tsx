'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Check, UserPlus, Search } from 'lucide-react';
import { playerService, Player } from '@/services/playerService';
import { matchService, PlayerToAdd, MatchPlayerEntry } from '@/services/matchService';

const POSITION_BADGE: Record<string, { label: string; color: string }> = {
  GOALKEEPER: { label: 'G',  color: 'bg-orange-900/30 text-orange-400' },
  DEFENDER:   { label: 'D',  color: 'bg-blue-900/30 text-blue-400' },
  MIDFIELDER: { label: 'M',  color: 'bg-green-900/30 text-green-400' },
  FORWARD:    { label: 'A',  color: 'bg-red-900/30 text-red-400' },
};

const MAX_STARTERS = 11;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  matchId: string;
  teamId: string;
}

export default function CompositionModal({ isOpen, onClose, onSuccess, matchId, teamId }: Props) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [existingPlayers, setExistingPlayers] = useState<MatchPlayerEntry[]>([]);
  // Ordered array — first 11 are STARTER, rest are SUBSTITUTE
  const [selectionOrder, setSelectionOrder] = useState<{ id: string; player: Player }[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setError('');
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [players, matchPlayers] = await Promise.all([
          playerService.getPlayersByTeam(teamId),
          matchService.getMatchPlayers(matchId),
        ]);
        const activePlayers = players.filter(p => p.status === 'ACTIVE');
        setAllPlayers(activePlayers);
        setExistingPlayers(matchPlayers);

        // Pre-select already convoked players, starters first then substitutes (preserves order)
        const starterEntries = matchPlayers.filter(mp => mp.status === 'STARTER');
        const subEntries = matchPlayers.filter(mp => mp.status === 'SUBSTITUTE');
        const ordered: { id: string; player: Player }[] = [];
        [...starterEntries, ...subEntries].forEach(mp => {
          const p = activePlayers.find(pl => pl.id === mp.player_id);
          if (p) ordered.push({ id: p.id, player: p });
        });
        setSelectionOrder(ordered);
      } catch {
        setError('Erreur lors du chargement des joueurs');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [isOpen, matchId, teamId]);

  // Compute status from order: first 11 = STARTER, rest = SUBSTITUTE
  const getStatus = useCallback((index: number): 'STARTER' | 'SUBSTITUTE' => {
    return index < MAX_STARTERS ? 'STARTER' : 'SUBSTITUTE';
  }, []);

  const selectedIds = useMemo(() => new Set(selectionOrder.map(s => s.id)), [selectionOrder]);

  const togglePlayer = (player: Player) => {
    setSelectionOrder(prev => {
      if (prev.some(s => s.id === player.id)) {
        return prev.filter(s => s.id !== player.id);
      } else {
        return [...prev, { id: player.id, player }];
      }
    });
  };

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return allPlayers;
    const q = search.toLowerCase();
    return allPlayers.filter(
      p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
    );
  }, [allPlayers, search]);

  const startersCount = useMemo(
    () => Math.min(selectionOrder.length, MAX_STARTERS),
    [selectionOrder]
  );
  const substitutesCount = useMemo(
    () => Math.max(0, selectionOrder.length - MAX_STARTERS),
    [selectionOrder]
  );

  const handleSubmit = async () => {
    if (selectionOrder.length === 0) return;
    try {
      setIsSubmitting(true);
      setError('');

      // Build full list with computed statuses
      const allSelected: PlayerToAdd[] = selectionOrder.map((s, i) => ({
        player_id: s.id,
        status: getStatus(i),
      }));

      // Determine players to remove (were convoked but now deselected)
      const toRemove = existingPlayers.filter(ep => !selectedIds.has(ep.player_id));

      // Execute removals
      await Promise.all(
        toRemove.map(p => matchService.removePlayerFromMatch(matchId, p.player_id).catch(() => {}))
      );

      // Send ALL selected players (upsert handles existing — updates status if changed)
      if (allSelected.length > 0) {
        await matchService.addPlayersToMatch(matchId, allSelected);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-dark-lighter rounded-2xl w-full max-w-lg shadow-2xl border border-neutral/20 dark:border-dark-light max-h-[85vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral/10 dark:border-dark-light flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-blue/10 flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5 text-accent-blue" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark dark:text-white">Composition</h2>
              <p className="text-[11px] text-dark-light/50 dark:text-neutral/50">
                {selectionOrder.length} joueur{selectionOrder.length !== 1 ? 's' : ''} sélectionné{selectionOrder.length !== 1 ? 's' : ''}
                <span className="mx-1">·</span>
                {startersCount} titu. · {substitutesCount} rempl.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-neutral/10 dark:hover:bg-dark-light flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-dark-light dark:text-neutral" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-light/40 dark:text-neutral/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un joueur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-lighter/60 dark:bg-dark-secondary/40 border border-neutral/20 dark:border-dark-light text-dark dark:text-white placeholder:text-dark-light/40 dark:placeholder:text-neutral/40 rounded-xl text-sm outline-none focus:border-accent-green transition-colors"
            />
          </div>
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-neutral/10 dark:bg-dark-light/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-10 text-dark-light/50 dark:text-neutral/50 text-sm">
              {search ? 'Aucun joueur trouvé' : 'Aucun joueur actif dans l\'équipe'}
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {filteredPlayers.map(player => {
                const isSelected = selectedIds.has(player.id);
                const selIndex = selectionOrder.findIndex(s => s.id === player.id);
                const status = selIndex >= 0 ? getStatus(selIndex) : null;
                const pos = player.position ? POSITION_BADGE[player.position] : null;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-accent-green/5 border border-accent-green/30 shadow-sm'
                        : 'border border-transparent hover:bg-neutral/5 dark:hover:bg-dark-secondary/30'
                    }`}
                    onClick={() => togglePlayer(player)}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-accent-green border-accent-green'
                          : 'border-neutral/40 dark:border-dark-light'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Order number */}
                    {isSelected && (
                      <span className="w-5 text-center text-[10px] font-bold text-dark-light/60 dark:text-neutral/50">
                        {selIndex + 1}
                      </span>
                    )}

                    {/* Jersey */}
                    <span className="w-7 text-center text-xs font-bold text-dark-light dark:text-neutral">
                      {player.jersey_number ?? '—'}
                    </span>

                    {/* Pos badge */}
                    {pos && (
                      <span className={`text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center ${pos.color}`}>
                        {pos.label}
                      </span>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark dark:text-white truncate">
                        {player.last_name} {player.first_name}
                      </p>
                    </div>

                    {/* Auto status badge */}
                    {isSelected && status && (
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                          status === 'STARTER'
                            ? 'bg-accent-green/15 text-accent-green'
                            : 'bg-accent-blue/15 text-accent-blue'
                        }`}
                      >
                        {status === 'STARTER' ? 'Titulaire' : 'Remplaçant'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-2 flex-shrink-0">
            <p className="text-sm text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral/10 dark:border-dark-light flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-neutral/20 dark:border-dark-light text-dark-light dark:text-neutral hover:bg-neutral/10 dark:hover:bg-dark-secondary transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectionOrder.length === 0}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent-green text-white hover:bg-accent-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sauvegarde...' : 'Valider la composition'}
          </button>
        </div>
      </div>
    </div>
  );
}
