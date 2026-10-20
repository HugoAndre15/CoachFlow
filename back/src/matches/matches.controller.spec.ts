import { Test, TestingModule } from '@nestjs/testing';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UpdateMatchStatusDto } from './dto/update-match-status.dto';
import { AddPlayersToMatchDto } from './dto/add-players-to-match.dto';
import { UpdateMatchPlayerDto } from './dto/update-match-player.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { UpdateMatchEventDto } from './dto/update-match-event.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { match_location, match_status, match_event_type } from '@prisma/client';

describe('MatchesController', () => {
  let controller: MatchesController;
  let service: MatchesService;

  const mockMatchesService = {
    withLock: jest.fn((id, action) => action(mockMatchesService)),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
    addPlayersToMatch: jest.fn(),
    getMatchPlayers: jest.fn(),
    updateMatchPlayerStatus: jest.fn(),
    removePlayerFromMatch: jest.fn(),
    addEventToMatch: jest.fn(),
    getMatchEvents: jest.fn(),
    updateMatchEvent: jest.fn(),
    removeMatchEvent: jest.fn(),
    getMatchStatistics: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [
        {
          provide: MatchesService,
          useValue: mockMatchesService,
        },
      ],
    }).compile();

    controller = module.get<MatchesController>(MatchesController);
    service = module.get<MatchesService>(MatchesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== CREATE ====================

  it('should call matchesService.create with correct parameters', async () => {
    // Arrange
    const createDto: CreateMatchDto = {
      team_id: 'team-1',
      opponent: 'Test Opponent',
      location: match_location.HOME,
      match_date: '2024-03-15T15:00:00Z',
    };
    const expectedResult = { id: 'match-1', status: match_status.UPCOMING, ...createDto };
    mockMatchesService.create.mockResolvedValue(expectedResult);

    // Act
    const result = await controller.create(createDto, mockUser);

    // Assert
    expect(service.create).toHaveBeenCalledWith(createDto, mockUser.id);
    expect(service.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedResult);
  });

  // ==================== FIND ALL ====================

  it('should call matchesService.findAll with all query parameters', async () => {
    // Arrange
    const teamId = 'team-1';
    const paginationQuery: PaginationQueryDto = { page: 1, limit: 10 };
    const status = 'FINISHED';
    const from = '2024-01-01';
    const to = '2024-12-31';
    const expectedResult = {
      data: [{ id: 'match-1', opponent: 'Test Opponent' }],
      total: 1,
      page: 1,
      limit: 10,
    };
    mockMatchesService.findAll.mockResolvedValue(expectedResult);

    // Act
    const result = await controller.findAll(
      teamId,
      paginationQuery,
      status,
      from,
      to,
      mockUser
    );

    // Assert
    expect(service.findAll).toHaveBeenCalledWith(
      teamId,
      mockUser.id,
      paginationQuery,
      status,
      from,
      to
    );
    expect(service.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedResult);
  });

  // ==================== FIND ONE ====================

  it('should call matchesService.findOne with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const expectedResult = { id: matchId, opponent: 'Test Opponent' };
    mockMatchesService.findOne.mockResolvedValue(expectedResult);

    // Act
    const result = await controller.findOne(matchId, mockUser);

    // Assert
    expect(service.findOne).toHaveBeenCalledWith(matchId, mockUser.id);
    expect(service.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedResult);
  });

  // ==================== UPDATE ====================

  it('should call matchesService.update with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const updateDto: UpdateMatchDto = {
      opponent: 'New Opponent',
      location: match_location.AWAY,
    };
    const expectedResult = { id: matchId, ...updateDto };
    mockMatchesService.update.mockResolvedValue(expectedResult);

    // Act
    const result = await controller.update(matchId, mockUser, updateDto);

    // Assert
    expect(service.update).toHaveBeenCalledWith(matchId, mockUser.id, updateDto);
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedResult);
  });

  // ==================== UPDATE STATUS ====================

  it('should call matchesService.updateStatus with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const updateStatusDto: UpdateMatchStatusDto = {
      status: match_status.LIVE,
    };
    const expectedResult = { id: matchId, status: match_status.LIVE };
    mockMatchesService.updateStatus.mockResolvedValue(expectedResult);

    // Act
    const result = await controller.updateStatus(matchId, mockUser, updateStatusDto);

    // Assert
    expect(service.updateStatus).toHaveBeenCalledWith(matchId, mockUser.id, updateStatusDto);
    expect(service.updateStatus).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedResult);
  });

  // ==================== REMOVE ====================

  it('should call matchesService.remove with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    mockMatchesService.remove.mockResolvedValue({ message: 'Match deleted' });

    // Act
    const result = await controller.remove(matchId, mockUser);

    // Assert
    expect(service.remove).toHaveBeenCalledWith(matchId, mockUser.id);
    expect(service.remove).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: 'Match deleted' });
  });

  // ==================== ADD PLAYERS ====================

  it('should call matchesService.addPlayersToMatch with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const addPlayersDto: AddPlayersToMatchDto = {
      players: [
        { player_id: 'player-1', status: 'STARTER' as any },
        { player_id: 'player-2', status: 'SUBSTITUTE' as any },
      ],
    };
    mockMatchesService.addPlayersToMatch.mockResolvedValue({ message: 'Players added' });

    // Act
    const result = await controller.addPlayersToMatch(matchId, addPlayersDto, mockUser);

    // Assert
    expect(service.addPlayersToMatch).toHaveBeenCalledWith(matchId, addPlayersDto, mockUser.id);
    expect(service.addPlayersToMatch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: 'Players added' });
  });

  // ==================== GET MATCH PLAYERS ====================

  it('should call matchesService.getMatchPlayers with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const expectedResult = [
      { player_id: 'player-1', status: 'STARTER' },
      { player_id: 'player-2', status: 'SUBSTITUTE' },
    ];
    mockMatchesService.getMatchPlayers.mockResolvedValue(expectedResult);

    // Act
    const result = await controller.getMatchPlayers(matchId, mockUser);

    // Assert
    expect(service.getMatchPlayers).toHaveBeenCalledWith(matchId, mockUser.id);
    expect(service.getMatchPlayers).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedResult);
  });

  // ==================== UPDATE MATCH PLAYER STATUS ====================

  it('should call matchesService.updateMatchPlayerStatus with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const playerId = 'player-1';
    const updateDto: UpdateMatchPlayerDto = {
      status: 'SUBSTITUTE' as any,
    };
    mockMatchesService.updateMatchPlayerStatus.mockResolvedValue({ message: 'Status updated' });

    // Act
    const result = await controller.updateMatchPlayerStatus(
      matchId,
      playerId,
      updateDto,
      mockUser
    );

    // Assert
    expect(service.updateMatchPlayerStatus).toHaveBeenCalledWith(
      matchId,
      playerId,
      updateDto,
      mockUser.id
    );
    expect(service.updateMatchPlayerStatus).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: 'Status updated' });
  });

  // ==================== REMOVE PLAYER FROM MATCH ====================

  it('should call matchesService.removePlayerFromMatch with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const playerId = 'player-1';
    mockMatchesService.removePlayerFromMatch.mockResolvedValue({ message: 'Player removed' });

    // Act
    const result = await controller.removePlayerFromMatch(matchId, playerId, mockUser);

    // Assert
    expect(service.removePlayerFromMatch).toHaveBeenCalledWith(matchId, playerId, mockUser.id);
    expect(service.removePlayerFromMatch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: 'Player removed' });
  });

  // ==================== ADD EVENT ====================

  it('should call matchesService.addEventToMatch with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const createEventDto: CreateMatchEventDto = {
      player_id: 'player-1',
      event_type: match_event_type.GOAL,
      minute: 45,
    };
    const expectedResult = { id: 'event-1', ...createEventDto };
    mockMatchesService.addEventToMatch.mockResolvedValue(expectedResult);

    // Act
    const result = await controller.addEventToMatch(matchId, createEventDto, mockUser);

    // Assert
    expect(service.addEventToMatch).toHaveBeenCalledWith(matchId, createEventDto, mockUser.id);
    expect(service.addEventToMatch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedResult);
  });

  // ==================== GET MATCH EVENTS ====================

  it('should call matchesService.getMatchEvents with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const expectedResult = [
      { id: 'event-1', type: match_event_type.GOAL, minute: 45 },
    ];
    mockMatchesService.getMatchEvents.mockResolvedValue(expectedResult);

    // Act
    const result = await controller.getMatchEvents(matchId, mockUser);

    // Assert
    expect(service.getMatchEvents).toHaveBeenCalledWith(matchId, mockUser.id);
    expect(service.getMatchEvents).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedResult);
  });

  // ==================== UPDATE MATCH EVENT ====================

  it('should call matchesService.updateMatchEvent with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const eventId = 'event-1';
    const updateEventDto: UpdateMatchEventDto = {
      minute: 50,
    };
    mockMatchesService.updateMatchEvent.mockResolvedValue({ message: 'Event updated' });

    // Act
    const result = await controller.updateMatchEvent(
      matchId,
      eventId,
      updateEventDto,
      mockUser
    );

    // Assert
    expect(service.updateMatchEvent).toHaveBeenCalledWith(
      matchId,
      eventId,
      updateEventDto,
      mockUser.id
    );
    expect(service.updateMatchEvent).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: 'Event updated' });
  });

  // ==================== REMOVE MATCH EVENT ====================

  it('should call matchesService.removeMatchEvent with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const eventId = 'event-1';
    mockMatchesService.removeMatchEvent.mockResolvedValue({ message: 'Event removed' });

    // Act
    const result = await controller.removeMatchEvent(matchId, eventId, mockUser);

    // Assert
    expect(service.removeMatchEvent).toHaveBeenCalledWith(matchId, eventId, mockUser.id);
    expect(service.removeMatchEvent).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: 'Event removed' });
  });

  // ==================== GET MATCH STATISTICS ====================

  it('should call matchesService.getMatchStatistics with correct parameters', async () => {
    // Arrange
    const matchId = 'match-1';
    const expectedResult = {
      matchId: 'match-1',
      opponent: 'FC Rival',
      totalGoals: 3,
      totalAssists: 2,
      totalYellowCards: 1,
      totalRedCards: 0,
      topScorer: { playerId: 'player-1', playerName: 'John Doe', jerseyNumber: 9, goals: 2 },
      topAssister: { playerId: 'player-2', playerName: 'Jane Smith', jerseyNumber: 10, assists: 2 },
    };
    mockMatchesService.getMatchStatistics.mockResolvedValue(expectedResult);

    // Act
    const result = await controller.getMatchStatistics(matchId, mockUser);

    // Assert
    expect(service.getMatchStatistics).toHaveBeenCalledWith(matchId, mockUser.id);
    expect(service.getMatchStatistics).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedResult);
  });
});
