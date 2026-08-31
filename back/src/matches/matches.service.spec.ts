import { Test, TestingModule } from '@nestjs/testing';
import { MatchesService } from './matches.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { createMockPrisma } from '../common/test/prisma-mock.helper';
import {
  club_role,
  team_role,
  match_status,
  match_event_type,
  match_player_status,
  match_location,
  field_zone,
  body_part,
  player_status,
} from '@prisma/client';
import { MatchPlayerStatus, MatchPresenceStatus } from './dto/add-players-to-match.dto';

describe('MatchesService', () => {
  let service: MatchesService;
  let prisma: any;

  const mockUserId = 'user123';
  const mockTeamId = 'team123';
  const mockClubId = 'club123';
  const mockMatchId = 'match123';
  const mockPlayerId = 'player123';
  const mockEventId = 'event123';

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== HELPERS ====================

  const mockCoachPermissions = () => {
    prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
    prisma.teamUser.findFirst.mockResolvedValue({
      team_id: mockTeamId,
      user_id: mockUserId,
      role: team_role.COACH,
    });
    prisma.clubUser.findFirst.mockResolvedValue(null); // Pas président
  };

  const mockPresidentPermissions = () => {
    prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
    prisma.clubUser.findFirst.mockResolvedValue({
      club_id: mockClubId,
      user_id: mockUserId,
      role: club_role.PRESIDENT,
    });
  };

  const mockClubMemberPermissions = () => {
    prisma.clubUser.findFirst.mockResolvedValue({
      club_id: mockClubId,
      user_id: mockUserId,
      role: club_role.RESPONSABLE,
    });
  };

  // ==================== CREATE ====================

  describe('create', () => {
    const createDto = {
      team_id: mockTeamId,
      opponent: 'FC Rival',
      location: match_location.HOME,
      match_date: '2024-12-25T15:00:00.000Z',
    };

    it('should create a match when user is COACH', async () => {
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      mockCoachPermissions();

      prisma.match.create.mockResolvedValue({
        id: mockMatchId,
        ...createDto,
        status: match_status.UPCOMING,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.create(createDto, mockUserId);

      expect(result).toHaveProperty('id');
      expect(result.opponent).toBe('FC Rival');
      expect(result.status).toBe(match_status.UPCOMING);
      expect(prisma.match.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            team_id: mockTeamId,
            opponent: 'FC Rival',
            status: match_status.UPCOMING,
          }),
        }),
      );
    });

    it('should create a match when user is PRESIDENT', async () => {
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      mockPresidentPermissions();

      prisma.match.create.mockResolvedValue({
        id: mockMatchId,
        ...createDto,
        status: match_status.UPCOMING,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await service.create(createDto, mockUserId);

      expect(result).toHaveProperty('id');
      expect(result.status).toBe(match_status.UPCOMING);
    });

    it('should throw NotFoundException if team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, mockUserId)).rejects.toThrow(NotFoundException);
      expect(prisma.match.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user lacks permissions', async () => {
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      prisma.teamUser.findFirst.mockResolvedValue(null);
      prisma.clubUser.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto, mockUserId)).rejects.toThrow(ForbiddenException);
      expect(prisma.match.create).not.toHaveBeenCalled();
    });
  });

  // ==================== FIND ALL ====================

  describe('findAll', () => {
    const mockMatches = [
      {
        id: 'match1',
        team_id: mockTeamId,
        opponent: 'Team A',
        location: 'Stadium A',
        match_date: new Date('2024-12-01'),
        status: match_status.UPCOMING,
        matchEvents: [],
        opponentEvents: [],
        _count: { matchEvents: 0, matchPlayers: 11 },
      },
      {
        id: 'match2',
        team_id: mockTeamId,
        opponent: 'Team B',
        location: 'Stadium B',
        match_date: new Date('2024-12-15'),
        status: match_status.LIVE,
        matchEvents: [],
        opponentEvents: [],
        _count: { matchEvents: 5, matchPlayers: 11 },
      },
    ];

    it('should return paginated matches when user is club member', async () => {
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      mockClubMemberPermissions();
      prisma.match.count.mockResolvedValue(2);
      prisma.match.findMany.mockResolvedValue(mockMatches);

      const result = await service.findAll(mockTeamId, mockUserId, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should throw BadRequestException if teamId is missing', async () => {
      await expect(service.findAll('', mockUserId, {})).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(service.findAll(mockTeamId, mockUserId, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not club member', async () => {
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      prisma.clubUser.findFirst.mockResolvedValue(null);

      await expect(service.findAll(mockTeamId, mockUserId, {})).rejects.toThrow(ForbiddenException);
    });

    it('should filter matches by status', async () => {
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      mockClubMemberPermissions();
      prisma.match.count.mockResolvedValue(1);
      prisma.match.findMany.mockResolvedValue([mockMatches[0]]);

      await service.findAll(mockTeamId, mockUserId, {}, 'UPCOMING');

      expect(prisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'UPCOMING',
          }),
        }),
      );
    });

    it('should filter matches by date range', async () => {
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      mockClubMemberPermissions();
      prisma.match.count.mockResolvedValue(1);
      prisma.match.findMany.mockResolvedValue([mockMatches[1]]);

      await service.findAll(
        mockTeamId,
        mockUserId,
        {},
        undefined,
        '2024-12-10',
        '2024-12-20',
      );

      expect(prisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            match_date: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it('should search matches by opponent or location', async () => {
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      mockClubMemberPermissions();
      prisma.match.count.mockResolvedValue(1);
      prisma.match.findMany.mockResolvedValue([mockMatches[0]]);

      await service.findAll(mockTeamId, mockUserId, { search: 'Team A' });

      expect(prisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { opponent: { contains: 'Team A', mode: 'insensitive' } },
              { location: { contains: 'Team A', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  // ==================== FIND ONE ====================

  describe('findOne', () => {
    const mockMatch = {
      id: mockMatchId,
      team_id: mockTeamId,
      opponent: 'FC Rival',
      location: 'Stadium',
      match_date: new Date(),
      status: match_status.LIVE,
      team: {
        id: mockTeamId,
        club_id: mockClubId,
        club: { id: mockClubId, name: 'My Club' },
      },
      matchPlayers: [],
      matchEvents: [
        { id: 'evt1', event_type: match_event_type.GOAL, minute: 15 },
        { id: 'evt2', event_type: match_event_type.YELLOW_CARD, minute: 30 },
      ],
      opponentEvents: [],
    };

    it('should return match details with score when user is club member', async () => {
      prisma.match.findUnique.mockResolvedValue(mockMatch);
      mockClubMemberPermissions();

      const result = await service.findOne(mockMatchId, mockUserId);

      expect(result).toHaveProperty('id', mockMatchId);
      expect(result).toHaveProperty('score');
      expect(result.score.home).toBe(1);
      expect(result.score.away).toBe(0);
    });

    it('should throw NotFoundException if match does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue(null);

      await expect(service.findOne(mockMatchId, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not club member', async () => {
      prisma.match.findUnique.mockResolvedValue(mockMatch);
      prisma.clubUser.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockMatchId, mockUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== UPDATE ====================

  describe('update', () => {
    const updateDto = {
      opponent: 'New Opponent',
      location: match_location.AWAY,
    };

    it('should update match when user is COACH', async () => {
      prisma.match.findUnique.mockResolvedValue({ id: mockMatchId, team_id: mockTeamId });
      mockCoachPermissions();
      prisma.match.update.mockResolvedValue({
        id: mockMatchId,
        ...updateDto,
        team_id: mockTeamId,
      });

      const result = await service.update(mockMatchId, mockUserId, updateDto);

      expect(result.opponent).toBe('New Opponent');
      expect(prisma.match.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if match does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue(null);

      await expect(service.update(mockMatchId, mockUserId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user lacks permissions', async () => {
      prisma.match.findUnique.mockResolvedValue({ id: mockMatchId, team_id: mockTeamId });
      prisma.teamUser.findFirst.mockResolvedValue(null);
      prisma.clubUser.findFirst.mockResolvedValue(null);
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });

      await expect(service.update(mockMatchId, mockUserId, updateDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ==================== UPDATE STATUS ====================

  describe('updateStatus', () => {
    it('should update status from UPCOMING to LIVE', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
        matchPlayers: [
          { id: 'mp-1', status: 'STARTER' },
          { id: 'mp-2', status: 'STARTER' },
        ],
      });
      mockCoachPermissions();
      prisma.match.update.mockResolvedValue({
        id: mockMatchId,
        status: match_status.LIVE,
      });

      const result = await service.updateStatus(mockMatchId, mockUserId, {
        status: match_status.LIVE,
      });

      expect(result.status).toBe(match_status.LIVE);
    });

    it('should update status from LIVE to FINISHED', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.LIVE,
      });
      mockCoachPermissions();
      prisma.match.update.mockResolvedValue({
        id: mockMatchId,
        status: match_status.FINISHED,
      });

      const result = await service.updateStatus(mockMatchId, mockUserId, {
        status: match_status.FINISHED,
      });

      expect(result.status).toBe(match_status.FINISHED);
    });

    it('should not count an absent starter when starting a match', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
        matchPlayers: [
          { id: 'mp-1', status: 'STARTER', presence: MatchPresenceStatus.PRESENT },
          { id: 'mp-2', status: 'STARTER', presence: MatchPresenceStatus.ABSENT },
        ],
      });
      mockCoachPermissions();

      await expect(
        service.updateStatus(mockMatchId, mockUserId, { status: match_status.LIVE }),
      ).rejects.toThrow('Il faut au moins 2 titulaires présents');
    });

    it('should throw BadRequestException for invalid status transition (UPCOMING to FINISHED)', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
      });
      mockCoachPermissions();

      await expect(
        service.updateStatus(mockMatchId, mockUserId, { status: match_status.FINISHED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid status transition (FINISHED to LIVE)', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.FINISHED,
      });
      mockCoachPermissions();

      await expect(
        service.updateStatus(mockMatchId, mockUserId, { status: match_status.LIVE }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is ASSISTANT_COACH (not allowed to change status)', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
      });
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      prisma.teamUser.findFirst.mockResolvedValue({
        team_id: mockTeamId,
        user_id: mockUserId,
        role: team_role.ASSISTANT_COACH,
      });
      prisma.clubUser.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus(mockMatchId, mockUserId, { status: match_status.LIVE }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== REMOVE ====================

  describe('remove', () => {
    it('should delete match when user is COACH', async () => {
      prisma.match.findUnique.mockResolvedValue({ id: mockMatchId, team_id: mockTeamId });
      mockCoachPermissions();
      prisma.match.delete.mockResolvedValue({ id: mockMatchId });

      const result = await service.remove(mockMatchId, mockUserId);

      expect(result).toHaveProperty('id');
      expect(prisma.match.delete).toHaveBeenCalledWith({ where: { id: mockMatchId } });
    });

    it('should delete match when user is PRESIDENT', async () => {
      prisma.match.findUnique.mockResolvedValue({ id: mockMatchId, team_id: mockTeamId });
      mockPresidentPermissions();
      prisma.match.delete.mockResolvedValue({ id: mockMatchId });

      const result = await service.remove(mockMatchId, mockUserId);

      expect(result).toHaveProperty('id');
    });

    it('should throw NotFoundException if match does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue(null);

      await expect(service.remove(mockMatchId, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not COACH or PRESIDENT', async () => {
      prisma.match.findUnique.mockResolvedValue({ id: mockMatchId, team_id: mockTeamId });
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      prisma.teamUser.findFirst.mockResolvedValue({
        team_id: mockTeamId,
        user_id: mockUserId,
        role: team_role.ASSISTANT_COACH,
      });
      prisma.clubUser.findFirst.mockResolvedValue(null);

      await expect(service.remove(mockMatchId, mockUserId)).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== ADD PLAYERS TO MATCH ====================

  describe('addPlayersToMatch', () => {
    const addPlayersDto = {
      players: [
        {
          player_id: 'player1',
          status: MatchPlayerStatus.STARTER,
          presence: MatchPresenceStatus.PRESENT,
        },
        { player_id: 'player2', status: MatchPlayerStatus.SUBSTITUTE },
      ],
    };

    const mockPlayers = [
      { id: 'player1', team_id: mockTeamId, status: player_status.ACTIVE, last_name: 'Doe' },
      { id: 'player2', team_id: mockTeamId, status: player_status.ACTIVE, last_name: 'Smith' },
    ];

    it('should add players to match when user is COACH', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
        team: { id: mockTeamId },
      });
      mockCoachPermissions();
      prisma.player.findMany.mockResolvedValue(mockPlayers);
      prisma.matchPlayer.upsert.mockResolvedValue({
        match_id: mockMatchId,
        player_id: 'player1',
        status: match_player_status.STARTER,
      });

      const result = await service.addPlayersToMatch(mockMatchId, addPlayersDto, mockUserId);

      expect(result).toHaveLength(2);
      expect(prisma.matchPlayer.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.matchPlayer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ presence: MatchPresenceStatus.PRESENT }),
          update: expect.objectContaining({ presence: MatchPresenceStatus.PRESENT }),
        }),
      );
    });

    it('should throw BadRequestException if match is FINISHED', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.FINISHED,
        team: { id: mockTeamId },
      });
      mockCoachPermissions();

      await expect(
        service.addPlayersToMatch(mockMatchId, addPlayersDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if player does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
        team: { id: mockTeamId },
      });
      mockCoachPermissions();
      prisma.player.findMany.mockResolvedValue([mockPlayers[0]]); // Un seul joueur trouvé

      await expect(
        service.addPlayersToMatch(mockMatchId, addPlayersDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if player does not belong to team', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
        team: { id: mockTeamId },
      });
      mockCoachPermissions();
      prisma.player.findMany.mockResolvedValue([
        { ...mockPlayers[0], team_id: 'other-team' },
        mockPlayers[1],
      ]);

      await expect(
        service.addPlayersToMatch(mockMatchId, addPlayersDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if player is not ACTIVE', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
        team: { id: mockTeamId },
      });
      mockCoachPermissions();
      prisma.player.findMany.mockResolvedValue([
        { ...mockPlayers[0], status: player_status.INJURED },
        mockPlayers[1],
      ]);

      await expect(
        service.addPlayersToMatch(mockMatchId, addPlayersDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== GET MATCH PLAYERS ====================

  describe('getMatchPlayers', () => {
    it('should return match players when user is club member', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        team: { id: mockTeamId, club_id: mockClubId },
      });
      mockClubMemberPermissions();
      prisma.matchPlayer.findMany.mockResolvedValue([
        { match_id: mockMatchId, player_id: 'player1', status: match_player_status.STARTER },
      ]);

      const result = await service.getMatchPlayers(mockMatchId, mockUserId);

      expect(result).toHaveLength(1);
      expect(prisma.matchPlayer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { match_id: mockMatchId },
        }),
      );
    });

    it('should throw NotFoundException if match does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue(null);

      await expect(service.getMatchPlayers(mockMatchId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not club member', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        team: { id: mockTeamId, club_id: mockClubId },
      });
      prisma.clubUser.findFirst.mockResolvedValue(null);

      await expect(service.getMatchPlayers(mockMatchId, mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ==================== UPDATE MATCH PLAYER STATUS ====================

  describe('updateMatchPlayerStatus', () => {
    it('should update match player status when user is COACH', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
      });
      mockCoachPermissions();
      prisma.matchPlayer.findUnique.mockResolvedValue({
        match_id: mockMatchId,
        player_id: mockPlayerId,
        status: match_player_status.SUBSTITUTE,
      });
      prisma.matchPlayer.update.mockResolvedValue({
        match_id: mockMatchId,
        player_id: mockPlayerId,
        status: match_player_status.STARTER,
      });

      const result = await service.updateMatchPlayerStatus(
        mockMatchId,
        mockPlayerId,
        { status: MatchPlayerStatus.STARTER },
        mockUserId,
      );

      expect(result.status).toBe(MatchPlayerStatus.STARTER);
    });

    it('should throw BadRequestException if match is FINISHED', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.FINISHED,
      });
      mockCoachPermissions();

      await expect(
        service.updateMatchPlayerStatus(
          mockMatchId,
          mockPlayerId,
          { status: MatchPlayerStatus.STARTER },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if player is not in match', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
      });
      mockCoachPermissions();
      prisma.matchPlayer.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMatchPlayerStatus(
          mockMatchId,
          mockPlayerId,
          { status: MatchPlayerStatus.STARTER },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== REMOVE PLAYER FROM MATCH ====================

  describe('removePlayerFromMatch', () => {
    it('should remove player from match when user is COACH', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
      });
      mockCoachPermissions();
      prisma.matchPlayer.findUnique.mockResolvedValue({
        match_id: mockMatchId,
        player_id: mockPlayerId,
      });
      prisma.matchEvent.count.mockResolvedValue(0);
      prisma.matchPlayer.delete.mockResolvedValue({});

      const result = await service.removePlayerFromMatch(mockMatchId, mockPlayerId, mockUserId);

      expect(result).toHaveProperty('message');
      expect(prisma.matchPlayer.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException if match is FINISHED', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.FINISHED,
      });
      mockCoachPermissions();

      await expect(
        service.removePlayerFromMatch(mockMatchId, mockPlayerId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if player is not in match', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
      });
      mockCoachPermissions();
      prisma.matchPlayer.findUnique.mockResolvedValue(null);

      await expect(
        service.removePlayerFromMatch(mockMatchId, mockPlayerId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if player has events in match', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        status: match_status.UPCOMING,
      });
      mockCoachPermissions();
      prisma.matchPlayer.findUnique.mockResolvedValue({
        match_id: mockMatchId,
        player_id: mockPlayerId,
      });
      prisma.matchEvent.count.mockResolvedValue(3); // Le joueur a 3 événements

      await expect(
        service.removePlayerFromMatch(mockMatchId, mockPlayerId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== ADD EVENT TO MATCH ====================

  describe('addEventToMatch', () => {
    const createEventDto = {
      player_id: mockPlayerId,
      event_type: match_event_type.GOAL,
      minute: 45,
      zone: field_zone.BOX,
      body_part: body_part.LEFT_FOOT,
    };

    it('should add event to match when user is COACH', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      mockCoachPermissions();
      prisma.matchPlayer.findUnique.mockResolvedValue({
        match_id: mockMatchId,
        player_id: mockPlayerId,
      });
      prisma.matchEvent.create.mockResolvedValue({
        id: mockEventId,
        ...createEventDto,
        match_id: mockMatchId,
      });

      const result = await service.addEventToMatch(mockMatchId, createEventDto, mockUserId);

      expect(result).toHaveProperty('id');
      if ('event_type' in result) {
        expect(result.event_type).toBe(match_event_type.GOAL);
      }
      expect(prisma.matchEvent.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if match does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue(null);

      await expect(
        service.addEventToMatch(mockMatchId, createEventDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if player is not in match', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      mockCoachPermissions();
      prisma.matchPlayer.findUnique.mockResolvedValue(null);

      await expect(
        service.addEventToMatch(mockMatchId, createEventDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject an event for an absent player', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      mockCoachPermissions();
      prisma.matchPlayer.findUnique.mockResolvedValue({
        match_id: mockMatchId,
        player_id: mockPlayerId,
        presence: MatchPresenceStatus.ABSENT,
      });

      await expect(
        service.addEventToMatch(mockMatchId, createEventDto, mockUserId),
      ).rejects.toThrow('Le joueur doit être marqué présent');
      expect(prisma.matchEvent.create).not.toHaveBeenCalled();
    });

    it('should validate ASSIST must reference a GOAL', async () => {
      const assistDto = {
        player_id: mockPlayerId,
        event_type: match_event_type.ASSIST,
        minute: 45,
        related_event_id: undefined,
      };

      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      mockCoachPermissions();
      prisma.matchPlayer.findUnique.mockResolvedValue({
        match_id: mockMatchId,
        player_id: mockPlayerId,
      });

      await expect(service.addEventToMatch(mockMatchId, assistDto, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create automatic RED_CARD after 2nd YELLOW_CARD', async () => {
      const yellowCardDto = {
        player_id: mockPlayerId,
        event_type: match_event_type.YELLOW_CARD,
        minute: 60,
      };

      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      mockCoachPermissions();
      prisma.matchPlayer.findUnique.mockResolvedValue({
        match_id: mockMatchId,
        player_id: mockPlayerId,
      });
      prisma.matchEvent.create
        .mockResolvedValueOnce({ id: 'yellow2', ...yellowCardDto })
        .mockResolvedValueOnce({ id: 'red1', event_type: match_event_type.RED_CARD });
      prisma.matchEvent.count.mockResolvedValue(2); // 2ème carton jaune

      const result = await service.addEventToMatch(mockMatchId, yellowCardDto, mockUserId);

      expect(result).toHaveProperty('autoRedCard');
      expect(result).toHaveProperty('message');
      expect(prisma.matchEvent.create).toHaveBeenCalledTimes(2); // Yellow + Red
    });
  });

  // ==================== GET MATCH EVENTS ====================

  describe('getMatchEvents', () => {
    const mockEvents = [
      {
        id: 'evt1',
        match_id: mockMatchId,
        player_id: mockPlayerId,
        event_type: match_event_type.GOAL,
        minute: 15,
      },
      {
        id: 'evt2',
        match_id: mockMatchId,
        player_id: mockPlayerId,
        event_type: match_event_type.YELLOW_CARD,
        minute: 30,
      },
    ];

    it('should return match events when user is club member', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        team: { id: mockTeamId, club_id: mockClubId },
      });
      mockClubMemberPermissions();
      prisma.matchEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.getMatchEvents(mockMatchId, mockUserId);

      expect(result).toHaveLength(2);
      expect(prisma.matchEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { match_id: mockMatchId },
          orderBy: [{ minute: 'asc' }, { created_at: 'asc' }],
        }),
      );
    });

    it('should throw NotFoundException if match does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue(null);

      await expect(service.getMatchEvents(mockMatchId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not club member', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
        team: { id: mockTeamId, club_id: mockClubId },
      });
      prisma.clubUser.findFirst.mockResolvedValue(null);

      await expect(service.getMatchEvents(mockMatchId, mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ==================== UPDATE MATCH EVENT ====================

  describe('updateMatchEvent', () => {
    const updateDto = {
      minute: 50,
    };

    it('should update event when user is COACH', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      mockCoachPermissions();
      prisma.matchEvent.findUnique.mockResolvedValue({
        id: mockEventId,
        match_id: mockMatchId,
        player_id: mockPlayerId,
        event_type: match_event_type.GOAL,
        minute: 45,
      });
      prisma.matchEvent.update.mockResolvedValue({
        id: mockEventId,
        minute: 50,
      });

      const result = await service.updateMatchEvent(
        mockMatchId,
        mockEventId,
        updateDto,
        mockUserId,
      );

      expect(result.minute).toBe(50);
      expect(prisma.matchEvent.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if event does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      mockCoachPermissions();
      prisma.matchEvent.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMatchEvent(mockMatchId, mockEventId, updateDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate player_id if changed', async () => {
      const updateWithPlayerId = { player_id: 'newPlayer' };

      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      mockCoachPermissions();
      prisma.matchEvent.findUnique.mockResolvedValue({
        id: mockEventId,
        match_id: mockMatchId,
        player_id: mockPlayerId,
        event_type: match_event_type.GOAL,
      });
      prisma.matchPlayer.findUnique.mockResolvedValue(null); // Nouveau joueur pas convoqué

      await expect(
        service.updateMatchEvent(mockMatchId, mockEventId, updateWithPlayerId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== REMOVE MATCH EVENT ====================

  describe('removeMatchEvent', () => {
    it('should delete event when user is COACH', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      mockCoachPermissions();
      prisma.matchEvent.findUnique.mockResolvedValue({
        id: mockEventId,
        match_id: mockMatchId,
        event_type: match_event_type.YELLOW_CARD,
      });
      prisma.matchEvent.delete.mockResolvedValue({});

      const result = await service.removeMatchEvent(mockMatchId, mockEventId, mockUserId);

      expect(result).toHaveProperty('message');
      expect(prisma.matchEvent.delete).toHaveBeenCalled();
    });

    it('should delete related ASSIST events when deleting a GOAL', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      mockCoachPermissions();
      prisma.matchEvent.findUnique.mockResolvedValue({
        id: mockEventId,
        match_id: mockMatchId,
        event_type: match_event_type.GOAL,
      });
      prisma.matchEvent.deleteMany.mockResolvedValue({ count: 1 });
      prisma.matchEvent.delete.mockResolvedValue({});

      const result = await service.removeMatchEvent(mockMatchId, mockEventId, mockUserId);

      expect(result).toHaveProperty('message');
      expect(prisma.matchEvent.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { related_event_id: mockEventId },
        }),
      );
      expect(prisma.matchEvent.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if event does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      mockCoachPermissions();
      prisma.matchEvent.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMatchEvent(mockMatchId, mockEventId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user lacks permissions', async () => {
      prisma.match.findUnique.mockResolvedValue({
        id: mockMatchId,
        team_id: mockTeamId,
      });
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      prisma.teamUser.findFirst.mockResolvedValue(null);
      prisma.clubUser.findFirst.mockResolvedValue(null);

      await expect(
        service.removeMatchEvent(mockMatchId, mockEventId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== GET MATCH STATISTICS ====================

  describe('getMatchStatistics', () => {
    const mockMatchWithEvents = {
      id: mockMatchId,
      team_id: mockTeamId,
      opponent: 'FC Rival',
      match_date: new Date('2025-03-15'),
      location: match_location.HOME,
      status: match_status.FINISHED,
      team: { id: mockTeamId, club_id: mockClubId },
      matchPlayers: [
        { id: 'mp-1', player_id: 'player-1', presence: MatchPresenceStatus.PRESENT },
        { id: 'mp-2', player_id: 'player-2', presence: MatchPresenceStatus.ABSENT },
      ],
      matchEvents: [
        {
          id: 'evt-1',
          player_id: 'player-1',
          event_type: match_event_type.GOAL,
          minute: 15,
          player: { id: 'player-1', first_name: 'John', last_name: 'Doe', jersey_number: 9, position: 'FORWARD' },
        },
        {
          id: 'evt-2',
          player_id: 'player-1',
          event_type: match_event_type.GOAL,
          minute: 55,
          player: { id: 'player-1', first_name: 'John', last_name: 'Doe', jersey_number: 9, position: 'FORWARD' },
        },
        {
          id: 'evt-3',
          player_id: 'player-2',
          event_type: match_event_type.ASSIST,
          minute: 15,
          player: { id: 'player-2', first_name: 'Jane', last_name: 'Smith', jersey_number: 10, position: 'MIDFIELDER' },
        },
        {
          id: 'evt-4',
          player_id: 'player-2',
          event_type: match_event_type.YELLOW_CARD,
          minute: 70,
          player: { id: 'player-2', first_name: 'Jane', last_name: 'Smith', jersey_number: 10, position: 'MIDFIELDER' },
        },
      ],
      opponentEvents: [],
    };

    it('should return match statistics for a COACH', async () => {
      prisma.match.findUnique.mockResolvedValue(mockMatchWithEvents);
      mockCoachPermissions();

      const result = await service.getMatchStatistics(mockMatchId, mockUserId);

      expect(result.matchId).toBe(mockMatchId);
      expect(result.opponent).toBe('FC Rival');
      expect(result.totalGoals).toBe(2);
      expect(result.totalOpponentGoals).toBe(0);
      expect(result.totalAssists).toBe(1);
      expect(result.totalYellowCards).toBe(1);
      expect(result.totalRedCards).toBe(0);
      expect(result.totalRecoveries).toBe(0);
      expect(result.totalBallLosses).toBe(0);
      expect(result.totalPlayers).toBe(1);
      expect(result.presenceCounts).toEqual({
        present: 1,
        uncertain: 0,
        absent: 1,
        unknown: 0,
      });
      expect(result.topScorer).toEqual({
        playerId: 'player-1',
        playerName: 'John Doe',
        jerseyNumber: 9,
        goals: 2,
      });
      expect(result.topAssister).toEqual({
        playerId: 'player-2',
        playerName: 'Jane Smith',
        jerseyNumber: 10,
        assists: 1,
      });
      expect(result.timeline).toHaveLength(4);
      expect(result.timeline[0].minute).toBe(15);
      expect(result.timeline[3].minute).toBe(70);
    });

    it('should return statistics for a PRESIDENT', async () => {
      prisma.match.findUnique.mockResolvedValue(mockMatchWithEvents);
      mockPresidentPermissions();

      const result = await service.getMatchStatistics(mockMatchId, mockUserId);

      expect(result.matchId).toBe(mockMatchId);
      expect(result.totalGoals).toBe(2);
    });

    it('should return stats with null topScorer/topAssister when no events', async () => {
      const emptyMatch = {
        ...mockMatchWithEvents,
        matchEvents: [],
        matchPlayers: [],
      };
      prisma.match.findUnique.mockResolvedValue(emptyMatch);
      mockCoachPermissions();

      const result = await service.getMatchStatistics(mockMatchId, mockUserId);

      expect(result.totalGoals).toBe(0);
      expect(result.totalAssists).toBe(0);
      expect(result.topScorer).toBeNull();
      expect(result.topAssister).toBeNull();
      expect(result.timeline).toEqual([]);
      expect(result.totalPlayers).toBe(0);
    });

    it('should throw NotFoundException if match does not exist', async () => {
      prisma.match.findUnique.mockResolvedValue(null);

      await expect(
        service.getMatchStatistics(mockMatchId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not COACH/ASSISTANT/PRESIDENT', async () => {
      prisma.match.findUnique.mockResolvedValue(mockMatchWithEvents);
      prisma.team.findUnique.mockResolvedValue({ id: mockTeamId, club_id: mockClubId });
      prisma.clubUser.findFirst.mockResolvedValue(null);
      prisma.teamUser.findFirst.mockResolvedValue(null);

      await expect(
        service.getMatchStatistics(mockMatchId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
