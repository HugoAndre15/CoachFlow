import {
  match_event_type,
  match_player_status,
  match_presence_status,
  player_status,
  type Match,
  type MatchEvent,
  type MatchPlayer,
  type Player,
} from '@prisma/client';
import { buildPlayerOverview, statsPeriodStart } from './player-overview';
import { PlayerStatsPeriod } from './dto/player-overview-query.dto';

const player = (id: string, status: player_status = 'ACTIVE') =>
  ({ id, first_name: id, last_name: 'Test', status }) as Player;
const entry = (
  id: string,
  status: match_player_status = 'STARTER',
  presence: match_presence_status = 'PRESENT',
) => ({ player_id: id, status, presence }) as MatchPlayer;
const event = (
  id: string,
  type: match_event_type,
  owner: string,
  minute = 20,
  incoming?: string,
) =>
  ({
    id,
    event_type: type,
    player_id: owner,
    minute,
    related_player_id: incoming,
    created_at: new Date('2026-09-01T10:00:00Z'),
  }) as MatchEvent;
const match = (
  matchPlayers: MatchPlayer[],
  matchEvents: MatchEvent[] = [],
  status: Match['status'] = 'FINISHED',
) =>
  ({ status, matchPlayers, matchEvents }) as Match & {
    matchPlayers: MatchPlayer[];
    matchEvents: MatchEvent[];
  };

describe('player overview', () => {
  it('distinguishes attendance, starting, entering, unused bench and absence', () => {
    const players = [
      'starter',
      'incoming',
      'bench',
      'absent',
      'uncertain',
      'unknown',
      'not-on-sheet',
    ].map((id) => player(id));
    const result = buildPlayerOverview(players, [
      match(
        [
          entry('starter'),
          entry('incoming', 'SUBSTITUTE'),
          entry('bench', 'SUBSTITUTE'),
          entry('absent', 'SUBSTITUTE', 'ABSENT'),
          entry('uncertain', 'SUBSTITUTE', 'UNCERTAIN'),
          entry('unknown', 'SUBSTITUTE', 'UNKNOWN'),
        ],
        [event('sub', 'SUBSTITUTION', 'starter', 40, 'incoming')],
      ),
    ]);
    const stats = Object.fromEntries(result.map((p) => [p.id, p.stats]));
    expect(stats.starter).toMatchObject({
      total_matches: 1,
      matches_as_starter: 1,
      matches_as_substitute: 0,
    });
    expect(stats.incoming).toMatchObject({
      total_matches: 1,
      matches_as_starter: 0,
      matches_as_substitute: 1,
    });
    expect(stats.bench).toMatchObject({
      total_matches: 0,
      unused_substitute: 1,
      attendance: { present: 1, rate: 100 },
    });
    expect(stats.absent).toMatchObject({
      total_matches: 0,
      attendance: { absent: 1, recorded: 1, rate: 0 },
    });
    expect(stats.uncertain.attendance).toMatchObject({
      uncertain: 1,
      recorded: 0,
      rate: null,
    });
    expect(stats.unknown.attendance).toMatchObject({
      unknown: 1,
      recorded: 0,
      rate: null,
    });
    expect(stats['not-on-sheet'].attendance).toMatchObject({
      absent: 0,
      recorded: 0,
      rate: null,
    });
  });

  it('counts a returning starter once and ignores invalid legacy substitutions', () => {
    const events = [
      event('back', 'SUBSTITUTION', 'b', 50, 'a'),
      event('valid', 'SUBSTITUTION', 'a', 20, 'b'),
      event('invalid', 'SUBSTITUTION', 'a', 30, 'c'),
      event('absent', 'SUBSTITUTION', 'a', 60, 'd'),
    ];
    const original = JSON.stringify(events);
    const rows = buildPlayerOverview(
      ['a', 'b', 'c', 'd'].map((id) => player(id)),
      [
        match(
          [
            entry('a'),
            entry('b', 'SUBSTITUTE'),
            entry('c', 'SUBSTITUTE'),
            entry('d', 'SUBSTITUTE', 'ABSENT'),
          ],
          events,
        ),
      ],
    );
    expect(rows.map((p) => p.stats.total_matches)).toEqual([1, 1, 0, 0]);
    expect(rows[0].stats.matches_as_starter).toBe(1);
    expect(rows[0].stats.matches_as_substitute).toBe(0);
    expect(JSON.stringify(events)).toBe(original);
  });

  it('keeps archived players, detailed goal data and recorded discipline without inventing play time', () => {
    const goal = {
      ...event('g', 'GOAL', 'a'),
      zone: 'ATT_CENTER',
      body_part: 'HEAD',
    } as MatchEvent;
    const events = [
      goal,
      event('a', 'ASSIST', 'a'),
      event('r', 'RECOVERY', 'a'),
      event('l', 'BALL_LOSS', 'a'),
      event('y', 'YELLOW_CARD', 'bench'),
      event('red', 'RED_CARD', 'a'),
      event('bad', 'GOAL', 'absent'),
    ];
    const rows = buildPlayerOverview(
      [player('a', 'RETIRED'), player('bench'), player('absent')],
      [
        match(
          [
            entry('a'),
            entry('bench', 'SUBSTITUTE'),
            entry('absent', 'STARTER', 'ABSENT'),
          ],
          events,
        ),
      ],
    );
    expect(rows[0]).toMatchObject({
      status: 'RETIRED',
      stats: {
        goals: 1,
        assists: 1,
        recoveries: 1,
        ball_losses: 1,
        red_cards: 1,
        goals_by_zone: { ATT_CENTER: 1 },
        goals_by_body_part: { HEAD: 1 },
      },
    });
    expect(rows[1].stats).toMatchObject({ yellow_cards: 1, total_matches: 0 });
    expect(rows[2].stats).toMatchObject({ goals: 0, total_matches: 0 });
  });

  it('excludes live and upcoming matches and uncertain entries from the attendance denominator', () => {
    const result = buildPlayerOverview(
      [player('a')],
      [
        match([entry('a')]),
        match([entry('a')]),
        match([entry('a', 'SUBSTITUTE', 'ABSENT')]),
        match([entry('a', 'SUBSTITUTE', 'UNCERTAIN')]),
        match([entry('a')], [event('goal', 'GOAL', 'a')], 'LIVE'),
        match([entry('a')], [], 'UPCOMING'),
      ],
    );
    expect(result[0].stats).toMatchObject({
      total_matches: 2,
      goals: 0,
      attendance: { recorded: 3, rate: 67, uncertain: 1 },
    });
  });

  it('returns no presence rate when no finished match sheet exists', () => {
    const stats = buildPlayerOverview([player('new')], [])[0].stats;
    expect(stats).toMatchObject({
      total_matches: 0,
      goals: 0,
      attendance: { rate: null, recorded: 0 },
    });
  });
});

describe('stats period boundaries', () => {
  it.each([
    ['2026-06-30T23:59:59Z', '2025-07-01T00:00:00.000Z'],
    ['2026-07-01T00:00:00Z', '2026-07-01T00:00:00.000Z'],
  ])('resolves season for %s', (now, expected) => {
    expect(
      statsPeriodStart(PlayerStatsPeriod.SEASON, new Date(now))?.toISOString(),
    ).toBe(expected);
  });
  it('includes today and the previous 29 calendar days, across month boundaries', () => {
    expect(
      statsPeriodStart(
        PlayerStatsPeriod.LAST_30_DAYS,
        new Date('2026-10-01T12:00:00Z'),
      )?.toISOString(),
    ).toBe('2026-09-02T00:00:00.000Z');
    expect(statsPeriodStart(PlayerStatsPeriod.ALL)).toBeUndefined();
  });
});
