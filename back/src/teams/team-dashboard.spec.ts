import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Player } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrisma } from '../common/test/prisma-mock.helper';
import { PlayerStatsPeriod } from '../players/dto/player-overview-query.dto';
import { TeamsService } from './teams.service';
import { buildDashboardStats, dashboardMatch } from './team-dashboard';

const player = (id: string, status = 'ACTIVE') =>
  ({
    id,
    status,
    first_name: id,
    last_name: 'Test',
    jersey_number: 8,
  }) as Player;
const match = (overrides = {}) =>
  ({
    id: 'match',
    team_id: 'team',
    created_at: new Date(),
    updated_at: new Date(),
    match_date: new Date('2026-10-18T12:00:00Z'),
    location: 'HOME',
    status: 'FINISHED',
    opponent: 'Adversaire',
    matchPlayers: [],
    matchEvents: [],
    opponentEvents: [],
    ...overrides,
  }) as Parameters<typeof dashboardMatch>[0];

describe('team dashboard statistics', () => {
  it('returns no fabricated rate or leaders for an empty team', () => {
    const result = buildDashboardStats([], []);
    expect(result.totals).toEqual({
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      scored: 0,
      conceded: 0,
      assists: 0,
    });
    expect(result.attendance.rate).toBeNull();
    expect(result.scorers).toEqual([]);
    expect(result.recent).toEqual([]);
  });

  it('counts wins, draws, losses and conceded goals from our perspective, also away', () => {
    const goal = { event_type: 'GOAL' };
    const result = buildDashboardStats(
      [],
      [
        match({
          location: 'AWAY',
          matchEvents: [goal, goal],
          opponentEvents: [goal],
        }),
        match({ matchEvents: [goal], opponentEvents: [goal] }),
        match({ opponentEvents: [goal, goal, { event_type: 'RED_CARD' }] }),
      ],
    );
    expect(result.totals).toMatchObject({
      matches: 3,
      wins: 1,
      draws: 1,
      losses: 1,
      scored: 3,
      conceded: 4,
    });
    expect(result.recent[0]).toMatchObject({
      result: 'WIN',
      scored: 2,
      conceded: 1,
    });
  });

  it('weights attendance by recorded decisions and preserves archived contributions', () => {
    const players = [
      player('A'),
      player('B', 'RETIRED'),
      player('C', 'INJURED'),
      player('D', 'SUSPENDED'),
    ];
    const result = buildDashboardStats(players, [
      match({
        matchPlayers: [
          { player_id: 'A', presence: 'PRESENT', status: 'STARTER' },
          { player_id: 'B', presence: 'PRESENT', status: 'STARTER' },
          { player_id: 'C', presence: 'UNCERTAIN' },
          { player_id: 'D', presence: 'UNKNOWN' },
        ],
        matchEvents: [
          { player_id: 'B', event_type: 'GOAL' },
          { player_id: 'A', event_type: 'ASSIST' },
        ],
      }),
      match({ matchPlayers: [{ player_id: 'A', presence: 'ABSENT' }] }),
    ]);
    expect(result.attendance).toEqual({
      present: 2,
      absent: 1,
      uncertain: 1,
      unknown: 1,
      recorded: 3,
      rate: 67,
    });
    expect(result.roster).toEqual({
      total: 3,
      available: 1,
      injured: 1,
      suspended: 1,
    });
    expect(result.scorers[0]).toMatchObject({
      id: 'B',
      archived: true,
      value: 1,
    });
    expect(result.assisters[0]).toMatchObject({ id: 'A', value: 1 });
    expect(result.totals.assists).toBe(1);
  });

  it('includes missing current players as unknown for the next match, excluding archived players', () => {
    const summary = dashboardMatch(
      match({
        status: 'UPCOMING',
        matchPlayers: [
          { player_id: 'A', presence: 'PRESENT' },
          { player_id: 'B', presence: 'UNKNOWN' },
        ],
      }),
      [player('A'), player('B'), player('C'), player('retired', 'RETIRED')],
    );
    expect(summary.attendance).toEqual({
      present: 1,
      absent: 0,
      uncertain: 0,
      unknown: 2,
    });
  });

  it('keeps all matches in the totals while returning only five recent summaries', () => {
    const result = buildDashboardStats(
      [],
      Array.from({ length: 7 }, (_, i) => match({ id: String(i) })),
    );
    expect(result.totals.matches).toBe(7);
    expect(result.recent).toHaveLength(5);
    expect(result.recent.map((m) => m.id)).toEqual(['0', '1', '2', '3', '4']);
  });
});

describe('team dashboard scope and permissions', () => {
  const now = new Date('2026-10-19T12:00:00Z');
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: TeamsService;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    prisma = createMockPrisma();
    service = new TeamsService(prisma as unknown as PrismaService);
    prisma.team.findUnique.mockResolvedValue({ id: 'team', club_id: 'club' });
    prisma.player.findMany.mockResolvedValue([]);
    prisma.match.findMany.mockResolvedValue([]);
    prisma.match.findFirst.mockResolvedValue(null);
    prisma.match.count.mockResolvedValue(0);
  });
  afterEach(() => jest.useRealTimers());

  it('rejects an unknown team', async () => {
    prisma.team.findUnique.mockResolvedValue(null);
    await expect(service.getDashboard('missing', 'user')).rejects.toThrow(
      NotFoundException,
    );
  });
  it.each([null, 'RESPONSABLE', 'COACH'])(
    'denies club role %s without membership in this team before querying its data',
    async (role) => {
      prisma.clubUser.findFirst.mockResolvedValue(role ? { role } : null);
      await expect(service.getDashboard('team', 'outsider')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.player.findMany).not.toHaveBeenCalled();
      expect(prisma.match.findMany).not.toHaveBeenCalled();
      expect(prisma.match.findFirst).not.toHaveBeenCalled();
    },
  );
  it.each(['COACH', 'ASSISTANT_COACH', 'PRESIDENT'])(
    'allows %s and scopes every match query to this team',
    async (role) => {
      if (role === 'PRESIDENT')
        prisma.clubUser.findFirst.mockResolvedValue({ role });
      else prisma.teamUser.findFirst.mockResolvedValue({ role });
      await service.getDashboard('team', 'staff');
      for (const method of ['findMany', 'findFirst', 'count'] as const) {
        for (const [query] of prisma.match[method].mock.calls)
          expect(query.where.team_id).toBe('team');
      }
    },
  );
  it.each([
    [PlayerStatsPeriod.ALL, undefined],
    [PlayerStatsPeriod.SEASON, new Date('2026-07-01T00:00:00Z')],
    [PlayerStatsPeriod.LAST_30_DAYS, new Date('2026-09-20T00:00:00Z')],
  ])(
    'uses finished past matches in %s, independently from operational fixtures',
    async (period, from) => {
      prisma.clubUser.findFirst.mockResolvedValue({ role: 'PRESIDENT' });
      const result = await service.getDashboard('team', 'staff', period);
      expect(prisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            team_id: 'team',
            status: 'FINISHED',
            match_date: { ...(from ? { gte: from } : {}) },
          },
        }),
      );
      expect(prisma.match.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            team_id: 'team',
            status: 'UPCOMING',
            match_date: { gte: now },
          },
        }),
      );
      expect(prisma.match.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { team_id: 'team', status: 'LIVE' } }),
      );
      expect(prisma.match.count).toHaveBeenCalledWith({
        where: { team_id: 'team', status: 'UPCOMING', match_date: { lt: now } },
      });
      expect(result.meta).toEqual({
        team_id: 'team',
        period,
        from: from?.toISOString() ?? null,
        to: now.toISOString(),
      });
    },
  );
});
