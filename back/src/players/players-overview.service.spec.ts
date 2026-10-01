import { ForbiddenException } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrisma } from '../common/test/prisma-mock.helper';
import { PlayerStatsPeriod } from './dto/player-overview-query.dto';

describe('team overview access and scope', () => {
  const now = new Date('2026-10-01T12:00:00Z');
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: PlayersService;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    prisma = createMockPrisma();
    service = new PlayersService(prisma as unknown as PrismaService);
    prisma.team.findUnique.mockResolvedValue({ club_id: 'club' });
    prisma.player.findMany.mockResolvedValue([]);
    prisma.match.findMany.mockResolvedValue([]);
  });
  afterEach(() => jest.useRealTimers());

  it('rejects outsiders before reading players or matches', async () => {
    await expect(service.getTeamOverview('team', 'outsider')).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.player.findMany).not.toHaveBeenCalled();
    expect(prisma.match.findMany).not.toHaveBeenCalled();
  });
  it.each(['COACH', 'ASSISTANT_COACH'])(
    'allows %s and limits statistics to finished matches of this team and period',
    async (role) => {
      prisma.teamUser.findFirst.mockResolvedValue({ role });
      const result = await service.getTeamOverview(
        'team',
        'staff',
        PlayerStatsPeriod.SEASON,
      );
      expect(prisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            team_id: 'team',
            status: 'FINISHED',
            match_date: { gte: new Date('2026-07-01T00:00:00Z'), lte: now },
          },
        }),
      );
      expect(result.meta).toMatchObject({
        team_id: 'team',
        period: 'SEASON',
        from: '2026-07-01T00:00:00.000Z',
        completed_matches: 0,
      });
    },
  );
  it('allows the president and includes archived players without the old 100-player truncation', async () => {
    prisma.clubUser.findFirst.mockResolvedValue({ role: 'PRESIDENT' });
    prisma.player.findMany.mockResolvedValue(
      Array.from({ length: 105 }, (_, i) => ({
        id: `p${i}`,
        status: i === 104 ? 'RETIRED' : 'ACTIVE',
      })),
    );
    const result = await service.getTeamOverview('team', 'president');
    expect(result.players).toHaveLength(105);
    expect(result.players[104].status).toBe('RETIRED');
    expect(prisma.player.findMany).toHaveBeenCalledWith({
      where: { team_id: 'team' },
      orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
    });
    expect(prisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          team_id: 'team',
          status: 'FINISHED',
          match_date: { lte: now },
        },
      }),
    );
  });
});
