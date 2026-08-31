import { Test, TestingModule } from '@nestjs/testing';
import { PlayersService } from './players.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrisma } from '../common/test/prisma-mock.helper';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { club_role, team_role, player_status, position, strong_foot, match_player_status, match_event_type } from '@prisma/client';

describe('PlayersService', () => {
  let service: PlayersService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== CREATE ====================
  describe('create', () => {
    it('devrait créer un joueur si l\'utilisateur est COACH de la team', async () => {
      // Arrange
      const createDto = {
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
      };
      const userId = 'user-1';
      const team = { id: 'team-1', name: 'U19', category: 'U19', club_id: 'club-1', created_at: new Date(), updated_at: new Date() };
      const player = { id: 'player-1', ...createDto, user_id: null, created_at: new Date(), updated_at: new Date() };

      prisma.team.findUnique.mockResolvedValue(team);
      prisma.teamUser.findFirst.mockResolvedValue({ team_id: 'team-1', user_id: userId, role: team_role.COACH });
      prisma.player.create.mockResolvedValue(player);

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(result).toEqual(player);
      expect(prisma.player.create).toHaveBeenCalledWith({ data: createDto });
    });

    it('devrait créer un joueur si l\'utilisateur est PRESIDENT du club', async () => {
      // Arrange
      const createDto = {
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
      };
      const userId = 'user-1';
      const team = { id: 'team-1', name: 'U19', category: 'U19', club_id: 'club-1', created_at: new Date(), updated_at: new Date() };

      prisma.team.findUnique.mockResolvedValue(team);
      prisma.teamUser.findFirst.mockResolvedValue(null);
      prisma.clubUser.findFirst.mockResolvedValue({ club_id: 'club-1', user_id: userId, role: club_role.PRESIDENT });
      prisma.player.create.mockResolvedValue({ id: 'player-1', ...createDto, user_id: null, created_at: new Date(), updated_at: new Date() });

      // Act
      const result = await service.create(createDto, userId);

      // Assert
      expect(result).toBeDefined();
    });

    it('devrait refuser si l\'utilisateur n\'a pas les permissions', async () => {
      // Arrange
      const createDto = {
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
      };
      const userId = 'user-1';
      const team = { id: 'team-1', name: 'U19', category: 'U19', club_id: 'club-1', created_at: new Date(), updated_at: new Date() };

      prisma.team.findUnique.mockResolvedValue(team);
      prisma.teamUser.findFirst.mockResolvedValue(null);
      prisma.clubUser.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto, userId)).rejects.toThrow(ForbiddenException);
    });

    it('devrait lancer NotFoundException si la team n\'existe pas', async () => {
      // Arrange
      const createDto = {
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'invalid',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
      };

      prisma.team.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== FIND ALL ====================
  describe('findAll', () => {
    it('devrait retourner les joueurs d\'une team avec pagination', async () => {
      // Arrange
      const teamId = 'team-1';
      const userId = 'user-1';
      const team = { id: teamId, name: 'U19', category: 'U19', club_id: 'club-1', created_at: new Date(), updated_at: new Date() };
      const players = [
        {
          id: 'player-1',
          first_name: 'Antoine',
          last_name: 'Dupont',
          team_id: teamId,
          jersey_number: 9,
          position: position.MIDFIELDER,
          strong_foot: strong_foot.RIGHT,
          status: player_status.ACTIVE,
          user_id: null,
          created_at: new Date(),
          updated_at: new Date(),
          team: { id: teamId, name: 'U19', category: 'U19' },
        },
      ];

      prisma.team.findUnique.mockResolvedValue(team);
      prisma.teamUser.findFirst.mockResolvedValue({ team_id: teamId, user_id: userId, role: team_role.COACH });
      prisma.player.count.mockResolvedValue(1);
      prisma.player.findMany.mockResolvedValue(players);

      // Act
      const result = await service.findAll(teamId, userId);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.player.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: { not: player_status.RETIRED },
        }),
      });
    });

    it('devrait refuser si non autorisé', async () => {
      // Arrange
      const team = { id: 'team-1', name: 'U19', category: 'U19', club_id: 'club-1', created_at: new Date(), updated_at: new Date() };

      prisma.team.findUnique.mockResolvedValue(team);
      prisma.teamUser.findFirst.mockResolvedValue(null);
      prisma.clubUser.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findAll('team-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('devrait filtrer par statut', async () => {
      // Arrange
      const team = { id: 'team-1', name: 'U19', category: 'U19', club_id: 'club-1', created_at: new Date(), updated_at: new Date() };

      prisma.team.findUnique.mockResolvedValue(team);
      prisma.teamUser.findFirst.mockResolvedValue({ role: team_role.COACH });
      prisma.player.count.mockResolvedValue(0);
      prisma.player.findMany.mockResolvedValue([]);

      // Act
      await service.findAll('team-1', 'user-1', {}, player_status.ACTIVE);

      // Assert
      expect(prisma.player.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: player_status.ACTIVE,
        }),
      });
    });

    it('devrait rechercher par nom', async () => {
      // Arrange
      const team = { id: 'team-1', name: 'U19', category: 'U19', club_id: 'club-1', created_at: new Date(), updated_at: new Date() };

      prisma.team.findUnique.mockResolvedValue(team);
      prisma.teamUser.findFirst.mockResolvedValue({ role: team_role.COACH });
      prisma.player.count.mockResolvedValue(0);
      prisma.player.findMany.mockResolvedValue([]);

      // Act
      await service.findAll('team-1', 'user-1', { search: 'Dupont' });

      // Assert
      expect(prisma.player.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: [
            { first_name: { contains: 'Dupont', mode: 'insensitive' } },
            { last_name: { contains: 'Dupont', mode: 'insensitive' } },
          ],
        }),
      });
    });
  });

  // ==================== FIND ONE ====================
  describe('findOne', () => {
    it('devrait retourner un joueur avec les détails de la team', async () => {
      // Arrange
      const playerId = 'player-1';
      const userId = 'user-1';
      const player = {
        id: playerId,
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        team: {
          id: 'team-1',
          name: 'U19',
          category: 'U19',
          club_id: 'club-1',
          created_at: new Date(),
          updated_at: new Date(),
          club: { id: 'club-1', name: 'FC Test' },
        },
      };

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.team.findUnique.mockResolvedValue({ club_id: 'club-1' } as any);
      prisma.clubUser.findFirst.mockResolvedValue(null); // Pas président
      prisma.teamUser.findFirst.mockResolvedValue({ role: team_role.COACH } as any);

      // Act
      const result = await service.findOne(playerId, userId);

      // Assert
      expect(result.id).toBe(playerId);
      expect(result.team).toBeDefined();
    });

    it('devrait lancer NotFoundException si joueur inexistant', async () => {
      // Arrange
      prisma.player.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('invalid', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('devrait refuser si non autorisé', async () => {
      // Arrange
      const player = {
        id: 'player-1',
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        team: {
          id: 'team-1',
          name: 'U19',
          category: 'U19',
          club_id: 'club-1',
          created_at: new Date(),
          updated_at: new Date(),
          club: { id: 'club-1', name: 'FC Test' },
        },
      };

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.teamUser.findFirst.mockResolvedValue(null);
      prisma.clubUser.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('player-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== UPDATE ====================
  describe('update', () => {
    it('devrait permettre au COACH de modifier un joueur', async () => {
      // Arrange
      const playerId = 'player-1';
      const userId = 'user-1';
      const updateDto = { jersey_number: 10 };
      const player = {
        id: playerId,
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.team.findUnique.mockResolvedValue({ club_id: 'club-1' } as any);
      prisma.clubUser.findFirst.mockResolvedValue(null); // Pas président
      prisma.teamUser.findFirst.mockResolvedValue({ role: team_role.COACH } as any);
      prisma.player.update.mockResolvedValue({ ...player, jersey_number: 10 });

      // Act
      const result = await service.update(playerId, userId, updateDto);

      // Assert
      expect(result.jersey_number).toBe(10);
    });

    it('devrait permettre au PRESIDENT du club de modifier un joueur', async () => {
      // Arrange
      const playerId = 'player-1';
      const userId = 'user-1';
      const updateDto = { jersey_number: 10 };
      const player = {
        id: playerId,
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.team.findUnique.mockResolvedValue({ id: 'team-1', name: 'U19', category: 'U19', club_id: 'club-1', created_at: new Date(), updated_at: new Date() });
      prisma.teamUser.findFirst.mockResolvedValue(null);
      prisma.clubUser.findFirst.mockResolvedValue({ role: club_role.PRESIDENT });
      prisma.player.update.mockResolvedValue({ ...player, jersey_number: 10 });

      // Act
      const result = await service.update(playerId, userId, updateDto);

      // Assert
      expect(result.jersey_number).toBe(10);
    });

    it('devrait vérifier les permissions sur la nouvelle team lors d\'un transfert', async () => {
      // Arrange
      const playerId = 'player-1';
      const userId = 'user-1';
      const updateDto = { team_id: 'team-2' };
      const player = {
        id: playerId,
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const newTeam = { id: 'team-2', name: 'Seniors', category: 'Seniors', club_id: 'club-1', created_at: new Date(), updated_at: new Date() };

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.team.findUnique
        .mockResolvedValueOnce({ club_id: 'club-1' } as any) // getTeamClubId pour team-1
        .mockResolvedValueOnce({ id: 'team-2', club_id: 'club-1' } as any) // vérifier que team-2 existe
        .mockResolvedValueOnce({ club_id: 'club-1' } as any); // getTeamClubId pour team-2
      prisma.clubUser.findFirst
        .mockResolvedValueOnce(null) // Pas président pour team-1
        .mockResolvedValueOnce(null); // Pas président pour team-2
      prisma.teamUser.findFirst
        .mockResolvedValueOnce({ role: team_role.COACH } as any) // COACH de team-1
        .mockResolvedValueOnce({ role: team_role.COACH } as any); // COACH de team-2
      prisma.player.update.mockResolvedValue({ ...player, team_id: 'team-2' });

      // Act
      const result = await service.update(playerId, userId, updateDto);

      // Assert
      expect(result.team_id).toBe('team-2');
      expect(prisma.team.findUnique).toHaveBeenCalledTimes(3); // getTeamClubId(team-1) + vérifier team-2 existe + getTeamClubId(team-2)
    });

    it('devrait refuser le transfert si pas de permissions sur la nouvelle team', async () => {
      // Arrange
      const player = {
        id: 'player-1',
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const newTeam = { id: 'team-2', name: 'Seniors', category: 'Seniors', club_id: 'club-2', created_at: new Date(), updated_at: new Date() };

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.team.findUnique
        .mockResolvedValueOnce({ club_id: 'club-1' } as any) // getTeamClubId pour team-1
        .mockResolvedValueOnce({ id: 'team-2', club_id: 'club-2' } as any) // vérifier que team-2 existe
        .mockResolvedValueOnce({ club_id: 'club-2' } as any); // getTeamClubId pour team-2
      prisma.clubUser.findFirst
        .mockResolvedValueOnce(null) // Pas président de club-1
        .mockResolvedValueOnce(null); // Pas président de club-2
      prisma.teamUser.findFirst
        .mockResolvedValueOnce({ role: team_role.COACH } as any) // COACH de team-1
        .mockResolvedValueOnce(null); // Pas COACH de team-2

      // Act & Assert
      await expect(service.update('player-1', 'user-1', { team_id: 'team-2' })).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== REMOVE ====================
  describe('remove', () => {
    it('devrait permettre au COACH d\'archiver un joueur', async () => {
      // Arrange
      const playerId = 'player-1';
      const userId = 'user-1';
      const player = {
        id: playerId,
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.team.findUnique.mockResolvedValue({ club_id: 'club-1' } as any);
      prisma.clubUser.findFirst.mockResolvedValue(null); // Pas président
      prisma.teamUser.findFirst.mockResolvedValue({ role: team_role.COACH } as any);
      const archivedPlayer = { ...player, status: player_status.RETIRED };
      prisma.player.update.mockResolvedValue(archivedPlayer);

      // Act
      const result = await service.remove(playerId, userId);

      // Assert
      expect(result).toEqual(archivedPlayer);
      expect(prisma.player.update).toHaveBeenCalledWith({
        where: { id: playerId },
        data: { status: player_status.RETIRED },
      });
    });

    it('devrait permettre au PRESIDENT du club d\'archiver un joueur', async () => {
      // Arrange
      const playerId = 'player-1';
      const userId = 'user-1';
      const player = {
        id: playerId,
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.team.findUnique.mockResolvedValue({ id: 'team-1', name: 'U19', category: 'U19', club_id: 'club-1', created_at: new Date(), updated_at: new Date() });
      prisma.teamUser.findFirst.mockResolvedValue(null);
      prisma.clubUser.findFirst.mockResolvedValue({ role: club_role.PRESIDENT });
      const archivedPlayer = { ...player, status: player_status.RETIRED };
      prisma.player.update.mockResolvedValue(archivedPlayer);

      // Act
      const result = await service.remove(playerId, userId);

      // Assert
      expect(result).toEqual(archivedPlayer);
    });

    it('devrait refuser si non autorisé', async () => {
      // Arrange
      const player = {
        id: 'player-1',
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.teamUser.findFirst.mockResolvedValue(null);
      prisma.clubUser.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('player-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ==================== GET PLAYER STATS ====================
  describe('getPlayerStats', () => {
    it('devrait retourner les statistiques complètes d\'un joueur', async () => {
      // Arrange
      const playerId = 'player-1';
      const userId = 'user-1';
      const player = {
        id: playerId,
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const matchPlayers = [
        { id: 'mp-1', match_id: 'match-1', player_id: playerId, status: match_player_status.STARTER, created_at: new Date(), updated_at: new Date() },
        { id: 'mp-2', match_id: 'match-2', player_id: playerId, status: match_player_status.SUBSTITUTE, created_at: new Date(), updated_at: new Date() },
        { id: 'mp-3', match_id: 'match-3', player_id: playerId, status: match_player_status.STARTER, created_at: new Date(), updated_at: new Date() },
      ];

      const events = [
        { id: 'event-1', match_id: 'match-1', player_id: playerId, event_type: match_event_type.GOAL, minute: 10, zone: 'BOX', body_part: 'RIGHT_FOOT', created_at: new Date(), updated_at: new Date() },
        { id: 'event-2', match_id: 'match-1', player_id: playerId, event_type: match_event_type.GOAL, minute: 45, zone: 'LEFT', body_part: 'HEAD', created_at: new Date(), updated_at: new Date() },
        { id: 'event-3', match_id: 'match-2', player_id: playerId, event_type: match_event_type.ASSIST, minute: 30, zone: null, body_part: null, created_at: new Date(), updated_at: new Date() },
        { id: 'event-4', match_id: 'match-3', player_id: playerId, event_type: match_event_type.YELLOW_CARD, minute: 60, zone: null, body_part: null, created_at: new Date(), updated_at: new Date() },
        { id: 'event-5', match_id: 'match-3', player_id: playerId, event_type: match_event_type.RECOVERY, minute: 70, zone: null, body_part: null, created_at: new Date(), updated_at: new Date() },
      ];

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.team.findUnique.mockResolvedValue({ club_id: 'club-1' } as any);
      prisma.clubUser.findFirst.mockResolvedValue(null); // Pas président
      prisma.teamUser.findFirst.mockResolvedValue({ role: team_role.COACH } as any);
      prisma.matchPlayer.findMany.mockResolvedValue(matchPlayers);
      prisma.matchEvent.findMany.mockResolvedValue(events);

      // Act
      const result = await service.getPlayerStats(playerId, userId);

      // Assert
      expect(result.player_id).toBe(playerId);
      expect(result.player_name).toBe('Dupont Antoine');
      expect(result.total_matches).toBe(3);
      expect(result.matches_as_starter).toBe(2);
      expect(result.matches_as_substitute).toBe(1);
      expect(result.goals).toBe(2);
      expect(result.assists).toBe(1);
      expect(result.yellow_cards).toBe(1);
      expect(result.red_cards).toBe(0);
      expect(result.recoveries).toBe(1);
      expect(result.goals_by_zone.BOX).toBe(1);
      expect(result.goals_by_zone.LEFT).toBe(1);
      expect(result.goals_by_body_part.RIGHT_FOOT).toBe(1);
      expect(result.goals_by_body_part.HEAD).toBe(1);
    });

    it('devrait retourner des stats vides si le joueur n\'a pas d\'événements', async () => {
      // Arrange
      const playerId = 'player-1';
      const userId = 'user-1';
      const player = {
        id: playerId,
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.team.findUnique.mockResolvedValue({ club_id: 'club-1' } as any);
      prisma.clubUser.findFirst.mockResolvedValue(null); // Pas président
      prisma.teamUser.findFirst.mockResolvedValue({ role: team_role.COACH } as any);
      prisma.matchPlayer.findMany.mockResolvedValue([]);
      prisma.matchEvent.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getPlayerStats(playerId, userId);

      // Assert
      expect(result.total_matches).toBe(0);
      expect(result.goals).toBe(0);
      expect(result.assists).toBe(0);
    });

    it('devrait refuser si non autorisé', async () => {
      // Arrange
      const player = {
        id: 'player-1',
        first_name: 'Antoine',
        last_name: 'Dupont',
        team_id: 'team-1',
        jersey_number: 9,
        position: position.MIDFIELDER,
        strong_foot: strong_foot.RIGHT,
        status: player_status.ACTIVE,
        user_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prisma.player.findUnique.mockResolvedValue(player);
      prisma.teamUser.findFirst.mockResolvedValue(null);
      prisma.clubUser.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPlayerStats('player-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
