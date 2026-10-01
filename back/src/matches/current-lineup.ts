import { match_player_status } from '@prisma/client';

type Player = {
  player_id: string;
  status: match_player_status;
  presence?: string;
};

type Event = {
  id: string;
  event_type: string;
  player_id: string;
  related_player_id?: string | null;
  minute: number;
  created_at?: Date;
};

/** Keep the starting lineup for statistics; derive the current lineup from saved changes. */
export function withCurrentLineup<T extends Player>(players: T[], events: Event[]) {
  const lineup = new Map(players.map(player => [player.player_id, { ...player, current_status: player.status }]));
  const substitutions = events.filter(event => event.event_type === 'SUBSTITUTION').sort((a, b) =>
    a.minute - b.minute ||
    (a.created_at?.getTime() ?? 0) - (b.created_at?.getTime() ?? 0) ||
    a.id.localeCompare(b.id),
  );

  for (const event of substitutions) {
    const outgoing = lineup.get(event.player_id);
    const incoming = event.related_player_id ? lineup.get(event.related_player_id) : undefined;
    // Ignore inconsistent legacy changes instead of adding an extra player to the pitch.
    if (!outgoing || !incoming || outgoing === incoming ||
      (outgoing.presence && outgoing.presence !== 'PRESENT') ||
      (incoming.presence && incoming.presence !== 'PRESENT') ||
      outgoing.current_status !== 'STARTER' || incoming.current_status !== 'SUBSTITUTE') continue;
    outgoing.current_status = 'SUBSTITUTE';
    incoming.current_status = 'STARTER';
  }

  return [...lineup.values()];
}
