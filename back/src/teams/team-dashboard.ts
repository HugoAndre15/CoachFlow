import type { Player, Prisma } from '@prisma/client';
import { buildPlayerOverview } from '../players/player-overview';

export const dashboardMatchInclude = {
  matchPlayers: true,
  matchEvents: true,
  opponentEvents: true,
} satisfies Prisma.MatchInclude;

type DashboardMatch = Prisma.MatchGetPayload<{
  include: typeof dashboardMatchInclude;
}>;

/** Scores are always expressed from our team's perspective, including away games. */
export function dashboardMatch(match: DashboardMatch, players: Player[]) {
  const sheetIds = new Set(match.matchPlayers.map((entry) => entry.player_id));
  const attendance = { present: 0, absent: 0, uncertain: 0, unknown: 0 };
  for (const entry of match.matchPlayers) {
    switch (entry.presence ?? 'PRESENT') {
      case 'PRESENT':
        attendance.present++;
        break;
      case 'ABSENT':
        attendance.absent++;
        break;
      case 'UNCERTAIN':
        attendance.uncertain++;
        break;
      default:
        attendance.unknown++;
    }
  }
  // A player not yet added to the sheet still needs a presence decision.
  if (match.status === 'UPCOMING') {
    attendance.unknown += players.filter(
      (p) => p.status !== 'RETIRED' && !sheetIds.has(p.id),
    ).length;
  }
  const scored = match.matchEvents.filter(
    (e) => e.event_type === 'GOAL',
  ).length;
  const conceded = match.opponentEvents.filter(
    (e) => e.event_type === 'GOAL',
  ).length;
  return {
    id: match.id,
    opponent: match.opponent,
    date: match.match_date.toISOString(),
    location: match.location,
    status: match.status,
    scored,
    conceded,
    attendance,
    result: (scored > conceded
      ? 'WIN'
      : scored < conceded
        ? 'LOSS'
        : 'DRAW') as 'WIN' | 'DRAW' | 'LOSS',
  };
}

/** The caller supplies only completed matches inside the requested date window. */
export function buildDashboardStats(
  players: Player[],
  matches: DashboardMatch[],
) {
  const rows = buildPlayerOverview(players, matches);
  const recent = matches.map((m) => dashboardMatch(m, players));
  const totals = {
    matches: matches.length,
    wins: 0,
    draws: 0,
    losses: 0,
    scored: 0,
    conceded: 0,
    assists: 0,
  };
  for (const match of recent) {
    totals[
      match.result === 'WIN'
        ? 'wins'
        : match.result === 'DRAW'
          ? 'draws'
          : 'losses'
    ]++;
    totals.scored += match.scored;
    totals.conceded += match.conceded;
  }
  const attendance = {
    present: 0,
    absent: 0,
    uncertain: 0,
    unknown: 0,
    recorded: 0,
    rate: null as number | null,
  };
  for (const row of rows) {
    totals.assists += row.stats.assists;
    for (const key of [
      'present',
      'absent',
      'uncertain',
      'unknown',
      'recorded',
    ] as const) {
      attendance[key] += row.stats.attendance[key];
    }
  }
  attendance.rate = attendance.recorded
    ? Math.round((100 * attendance.present) / attendance.recorded)
    : null;
  const leaders = (key: 'goals' | 'assists') =>
    rows
      .filter((row) => row.stats[key] > 0)
      .sort(
        (a, b) =>
          b.stats[key] - a.stats[key] ||
          `${a.last_name} ${a.first_name}`.localeCompare(
            `${b.last_name} ${b.first_name}`,
            'fr',
          ) ||
          a.id.localeCompare(b.id),
      )
      .slice(0, 3)
      .map((row) => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        number: row.jersey_number,
        archived: row.status === 'RETIRED',
        value: row.stats[key],
      }));
  const roster = { total: 0, available: 0, injured: 0, suspended: 0 };
  for (const player of players) {
    if (player.status === 'RETIRED') continue;
    roster.total++;
    if (player.status === 'ACTIVE') roster.available++;
    if (player.status === 'INJURED') roster.injured++;
    if (player.status === 'SUSPENDED') roster.suspended++;
  }
  return {
    totals,
    attendance,
    roster,
    scorers: leaders('goals'),
    assisters: leaders('assists'),
    recent: recent.slice(0, 5),
  };
}
