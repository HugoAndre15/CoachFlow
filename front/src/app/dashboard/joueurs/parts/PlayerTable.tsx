import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Player, PlayerStats } from '@/services/playerService';
import { POSITION_LABELS, STATUS_STYLE, STATUS_LABEL, FOOT_LABEL } from './constants';

interface PlayerTableProps {
  players: Player[];
  statsMap: Record<string, PlayerStats>;
  isLoadingStats: boolean;
  onView: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function PlayerCard({
  player,
  stats,
  isLoadingStats,
  onView,
  onEdit,
  onDelete,
}: {
  player: Player;
  stats: PlayerStats | undefined;
  isLoadingStats: boolean;
  onView: (p: Player) => void;
  onEdit: (p: Player) => void;
  onDelete: (id: string) => void;
}) {
  const pos = player.position ? POSITION_LABELS[player.position] : null;

  return (
    <div className="bg-white/60 dark:bg-dark-lighter/60 backdrop-blur-sm border border-neutral/15 dark:border-dark-light/70 rounded-xl p-4">
      {/* Top: avatar + info + actions */}
      <div className="flex items-start gap-3">
        {/* Jersey */}
        <div className="w-10 h-10 rounded-xl bg-dark-light/10 dark:bg-dark-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-black text-dark dark:text-white">
            {player.jersey_number ?? '—'}
          </span>
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-dark dark:text-white leading-tight">
            {player.last_name}{' '}
            <span className="font-normal text-dark-light/70 dark:text-neutral">{player.first_name}</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {pos && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${pos.bg} ${pos.text}`}>
                {pos.label}
              </span>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[player.status]}`}>
              {STATUS_LABEL[player.status]}
            </span>
            {player.strong_foot && (
              <span className="text-[10px] text-dark-light/45 dark:text-neutral/45">
                Pied {FOOT_LABEL[player.strong_foot]?.toLowerCase() ?? '—'}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            title="Voir le profil"
            onClick={() => onView(player)}
            className="p-1.5 rounded-lg text-dark-light/40 dark:text-neutral/40 hover:text-accent-blue hover:bg-accent-blue/10 transition-all"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            title="Modifier"
            onClick={() => onEdit(player)}
            className="p-1.5 rounded-lg text-dark-light/40 dark:text-neutral/40 hover:text-accent-green hover:bg-accent-green/10 transition-all"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            title="Supprimer"
            onClick={() => onDelete(player.id)}
            className="p-1.5 rounded-lg text-dark-light/40 dark:text-neutral/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom: stats strip */}
      {isLoadingStats && !stats ? (
        <div className="mt-3 pt-3 border-t border-neutral/10 dark:border-dark-light/30">
          <div className="h-7 bg-neutral/10 rounded-lg animate-pulse" />
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-neutral/10 dark:border-dark-light/30 grid grid-cols-5 gap-1">
          {[
            { value: stats?.goals ?? '—', label: 'Buts', color: 'text-yellow-400' },
            { value: stats?.assists ?? '—', label: 'Passes dé.', color: 'text-accent-blue' },
            { value: stats?.recoveries ?? '—', label: 'Récup.', color: 'text-accent-green' },
            { value: stats?.ball_losses ?? '—', label: 'Pertes', color: 'text-red-400' },
            { value: stats?.total_matches ?? '—', label: 'MJ', color: 'text-dark dark:text-white' },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center">
              <p className={`text-sm font-bold ${color}`}>{value}</p>
              <p className="text-[9px] text-neutral/55 mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlayerTable({
  players,
  statsMap,
  isLoadingStats,
  onView,
  onEdit,
  onDelete,
}: PlayerTableProps) {
  return (
    <>
      {/* ── Mobile: card list ───────────────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            stats={statsMap[player.id]}
            isLoadingStats={isLoadingStats}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* ── Desktop: table ──────────────────────────────────────────── */}
      <div className="hidden md:block bg-white/60 dark:bg-dark-lighter/60 backdrop-blur-sm border border-neutral/15 dark:border-dark-light/70 rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[36px_1fr_72px_64px_70px_48px_48px_48px_48px_64px_52px_90px] gap-2 px-4 py-2.5 border-b border-neutral/10 dark:border-dark-light bg-neutral-lighter/30 dark:bg-dark-secondary/40">
          <span className="text-[11px] font-semibold text-dark-light/50 dark:text-neutral/50 text-center">#</span>
          <span className="text-[11px] font-semibold text-dark-light/50 dark:text-neutral/50">Joueur</span>
          <span className="text-[11px] font-semibold text-dark-light/50 dark:text-neutral/50">Poste</span>
          <span className="text-[11px] font-semibold text-dark-light/50 dark:text-neutral/50">Pied</span>
          <span className="text-[11px] font-semibold text-dark-light/50 dark:text-neutral/50">Statut</span>
          <span className="text-[11px] font-semibold text-yellow-400 text-center">Buts</span>
          <span className="text-[11px] font-semibold text-accent-blue text-center">Passes</span>
          <span className="text-[11px] font-semibold text-accent-green text-center">Récup.</span>
          <span className="text-[11px] font-semibold text-red-400 text-center">Pertes</span>
          <span className="text-[11px] font-semibold text-dark-light/50 dark:text-neutral/50 text-center">Cartons</span>
          <span className="text-[11px] font-semibold text-dark-light/50 dark:text-neutral/50 text-center">MJ</span>
          <span className="text-[11px] font-semibold text-dark-light/50 dark:text-neutral/50 text-center">Actions</span>
        </div>

        {/* Player rows */}
        {players.map((player, idx) => {
          const stats = statsMap[player.id];
          const pos   = player.position ? POSITION_LABELS[player.position] : null;
          return (
            <div
              key={player.id}
              className="grid grid-cols-[36px_1fr_72px_64px_70px_48px_48px_48px_48px_64px_52px_90px] gap-2 px-4 py-3 border-b border-neutral/5 dark:border-dark-light/40 last:border-0 hover:bg-accent-green/[0.03] dark:hover:bg-accent-green/[0.05] transition-colors items-center group"
            >
              {/* Numéro */}
              <span className="text-sm font-bold text-dark-light/40 dark:text-neutral/40 text-center group-hover:text-dark-light dark:group-hover:text-neutral transition-colors">
                {player.jersey_number ?? idx + 1}
              </span>

              {/* Nom */}
              <div>
                <p className="text-sm font-semibold text-dark dark:text-white">
                  {player.last_name}{' '}
                  <span className="font-normal text-dark-light/70 dark:text-neutral">{player.first_name}</span>
                </p>
              </div>

              {/* Poste */}
              {pos ? (
                <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-md w-fit ${pos.bg} ${pos.text}`}>
                  {pos.label}
                </span>
              ) : (
                <span className="text-xs text-neutral/30">—</span>
              )}

              {/* Pied fort */}
              <span className="text-xs text-dark-light/60 dark:text-neutral/60">
                {player.strong_foot ? FOOT_LABEL[player.strong_foot] : '—'}
              </span>

              {/* Statut */}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${STATUS_STYLE[player.status]}`}>
                {STATUS_LABEL[player.status]}
              </span>

              {/* Stats */}
              {isLoadingStats && !stats ? (
                <div className="col-span-7 flex items-center justify-center">
                  <div className="h-2 w-16 bg-neutral/10 rounded-full animate-pulse" />
                </div>
              ) : (
                <>
                  <span className="text-sm text-center font-semibold text-yellow-400">{stats?.goals ?? '—'}</span>
                  <span className="text-sm text-center font-semibold text-accent-blue">{stats?.assists ?? '—'}</span>
                  <span className="text-sm text-center font-semibold text-accent-green">{stats?.recoveries ?? '—'}</span>
                  <span className="text-sm text-center font-semibold text-red-400">{stats?.ball_losses ?? '—'}</span>
                  <div className="flex items-center justify-center gap-1">
                    {(stats?.yellow_cards ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-yellow-400">
                        <span className="w-2.5 h-3.5 rounded-[2px] bg-yellow-400 inline-block" />
                        {stats!.yellow_cards}
                      </span>
                    )}
                    {(stats?.red_cards ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-red-400">
                        <span className="w-2.5 h-3.5 rounded-[2px] bg-red-500 inline-block" />
                        {stats!.red_cards}
                      </span>
                    )}
                    {(stats?.yellow_cards ?? 0) === 0 && (stats?.red_cards ?? 0) === 0 && (
                      <span className="text-neutral/30 text-sm">—</span>
                    )}
                  </div>
                  <span className="text-sm text-center font-semibold text-dark dark:text-white">{stats?.total_matches ?? '—'}</span>
                  {/* Actions */}
                  <div className="flex items-center justify-center gap-1">
                    <button
                      title="Voir le profil"
                      onClick={() => onView(player)}
                      className="p-1.5 rounded-lg text-dark-light/40 dark:text-neutral/40 hover:text-accent-blue hover:bg-accent-blue/10 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Modifier"
                      onClick={() => onEdit(player)}
                      className="p-1.5 rounded-lg text-dark-light/40 dark:text-neutral/40 hover:text-accent-green hover:bg-accent-green/10 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Supprimer"
                      onClick={() => onDelete(player.id)}
                      className="p-1.5 rounded-lg text-dark-light/40 dark:text-neutral/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
