import type { Match, MatchEvent, MatchPlayer, Player } from '@prisma/client';
import { matchParticipants } from '../matches/current-lineup';
import { PlayerStatsPeriod } from './dto/player-overview-query.dto';

export function statsPeriodStart(
  period: PlayerStatsPeriod,
  now = new Date(),
): Date | undefined {
  if (period === PlayerStatsPeriod.SEASON) {
    return new Date(
      Date.UTC(now.getUTCFullYear() - (now.getUTCMonth() < 6 ? 1 : 0), 6, 1),
    );
  }
  if (period === PlayerStatsPeriod.LAST_30_DAYS) {
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29),
    );
  }
  return undefined;
}

type RecordedMatch = Match & {
  matchPlayers: MatchPlayer[];
  matchEvents: MatchEvent[];
};

/** One pass over completed match sheets; a place on the bench is not an appearance. */
export function buildPlayerOverview(
  players: Player[],
  matches: RecordedMatch[],
) {
  const rows = players.map((player) => ({
    ...player,
    stats: {
      player_id: player.id,
      player_name: `${player.first_name} ${player.last_name}`,
      total_matches: 0,
      matches_as_starter: 0,
      matches_as_substitute: 0,
      unused_substitute: 0,
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      recoveries: 0,
      ball_losses: 0,
      goals_by_zone: {} as Record<string, number>,
      goals_by_body_part: {} as Record<string, number>,
      attendance: {
        present: 0,
        absent: 0,
        uncertain: 0,
        unknown: 0,
        recorded: 0,
        rate: null as number | null,
      },
    },
  }));
  const byId = new Map(rows.map((row) => [row.id, row]));

  for (const match of matches) {
    if (match.status !== 'FINISHED') continue;
    const played = matchParticipants(match.matchPlayers, match.matchEvents);
    const present = new Set<string>();
    for (const entry of match.matchPlayers) {
      const stats = byId.get(entry.player_id)?.stats;
      if (!stats) continue;
      switch (entry.presence ?? 'PRESENT') {
        case 'PRESENT':
          present.add(entry.player_id);
          stats.attendance.present++;
          if (played.has(entry.player_id)) {
            stats.total_matches++;
            if (entry.status === 'STARTER') stats.matches_as_starter++;
            else stats.matches_as_substitute++;
          } else stats.unused_substitute++;
          break;
        case 'ABSENT':
          stats.attendance.absent++;
          break;
        case 'UNCERTAIN':
          stats.attendance.uncertain++;
          break;
        default:
          stats.attendance.unknown++;
      }
    }
    for (const event of match.matchEvents) {
      const stats = byId.get(event.player_id)?.stats;
      if (!stats || !present.has(event.player_id)) continue;
      switch (event.event_type) {
        case 'GOAL':
          stats.goals++;
          if (event.zone)
            stats.goals_by_zone[event.zone] =
              (stats.goals_by_zone[event.zone] ?? 0) + 1;
          if (event.body_part)
            stats.goals_by_body_part[event.body_part] =
              (stats.goals_by_body_part[event.body_part] ?? 0) + 1;
          break;
        case 'ASSIST':
          stats.assists++;
          break;
        case 'YELLOW_CARD':
          stats.yellow_cards++;
          break;
        case 'RED_CARD':
          stats.red_cards++;
          break;
        case 'RECOVERY':
          stats.recoveries++;
          break;
        case 'BALL_LOSS':
          stats.ball_losses++;
          break;
      }
    }
  }
  for (const { stats } of rows) {
    const attendance = stats.attendance;
    attendance.recorded = attendance.present + attendance.absent;
    attendance.rate = attendance.recorded
      ? Math.round((100 * attendance.present) / attendance.recorded)
      : null;
  }
  return rows;
}
