import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PaginationQueryDto, PaginatedResult } from '../common/dto/pagination-query.dto';
import { club_role, team_role } from '@prisma/client';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== HELPERS PRIVÉS ====================

  /**
   * Récupère le rôle d'un utilisateur dans une TEAM
   */
  private async getUserRoleInTeam(teamId: string, userId: string): Promise<team_role | null> {
    const teamUser = await this.prisma.teamUser.findFirst({
      where: {
        team_id: teamId,
        user_id: userId,
      },
    });
    return teamUser?.role || null;
  }

  /**
   * Récupère le club_id d'une team
   */
  private async getTeamClubId(teamId: string): Promise<string | null> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { club_id: true },
    });
    return team?.club_id || null;
  }

  /**
   * Vérifie si l'utilisateur est PRESIDENT du club
   */
  private async isClubPresident(clubId: string, userId: string): Promise<boolean> {
    const clubUser = await this.prisma.clubUser.findFirst({
      where: {
        club_id: clubId,
        user_id: userId,
      },
    });
    return clubUser?.role === club_role.PRESIDENT;
  }

  /**
   * Vérifie si l'utilisateur peut gérer les players de cette team
   * Autorisé: COACH, ASSISTANT_COACH de la team OU PRESIDENT du club
   */
  private async canManagePlayers(teamId: string, userId: string): Promise<boolean> {
    const clubId = await this.getTeamClubId(teamId);
    if (!clubId) {
      return false;
    }

    // Vérifier si PRESIDENT du club
    const isPresident = await this.isClubPresident(clubId, userId);
    if (isPresident) {
      return true;
    }

    // Vérifier si COACH ou ASSISTANT_COACH de la team
    const teamRole = await this.getUserRoleInTeam(teamId, userId);
    return teamRole === team_role.COACH || teamRole === team_role.ASSISTANT_COACH;
  }

  // ==================== CRUD ====================

  /**
   * Créer un joueur dans une équipe
   */
  async create(createPlayerDto: CreatePlayerDto, userId: string) {
    // Vérifier que la team existe
    const team = await this.prisma.team.findUnique({
      where: { id: createPlayerDto.team_id },
    });

    if (!team) {
      throw new NotFoundException('Équipe non trouvée');
    }

    // Vérifier les permissions
    const canManage = await this.canManagePlayers(createPlayerDto.team_id, userId);
    if (!canManage) {
      throw new ForbiddenException('Seuls le coach, l\'assistant ou le président du club peuvent ajouter un joueur');
    }

    return this.prisma.player.create({
      data: createPlayerDto,
    });
  }

  /**
   * Lister les joueurs avec pagination, filtres, recherche et tri
   * - Si teamId fourni : joueurs de cette équipe (vérifie permissions)
   * - Si pas de teamId : joueurs de toutes les équipes auxquelles l'utilisateur a accès
   */
  async findAll(
    teamId: string | undefined,
    userId: string,
    paginationQuery: PaginationQueryDto = {},
    status?: string,
    position?: string,
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sortBy, order = 'asc', search } = paginationQuery;

    // Construire le WHERE dynamique
    const where: any = {};

    if (teamId) {
      // Vérifier que la team existe
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new NotFoundException('Équipe non trouvée');
      }

      // Vérifier les permissions
      const canManage = await this.canManagePlayers(teamId, userId);
      if (!canManage) {
        throw new ForbiddenException('Vous n\'avez pas accès aux joueurs de cette équipe');
      }

      where.team_id = teamId;
    } else {
      // Pas de teamId : récupérer toutes les teams où l'utilisateur a accès
      const userTeams = await this.prisma.teamUser.findMany({
        where: { user_id: userId },
        select: { team_id: true },
      });

      // Aussi récupérer les teams des clubs dont l'utilisateur est président
      const presidentClubs = await this.prisma.clubUser.findMany({
        where: {
          user_id: userId,
          role: club_role.PRESIDENT,
        },
        select: { club_id: true },
      });

      let accessibleTeamIds = userTeams.map(tu => tu.team_id);

      if (presidentClubs.length > 0) {
        const clubTeams = await this.prisma.team.findMany({
          where: {
            club_id: { in: presidentClubs.map(pc => pc.club_id) },
          },
          select: { id: true },
        });
        const clubTeamIds = clubTeams.map(t => t.id);
        accessibleTeamIds = [...new Set([...accessibleTeamIds, ...clubTeamIds])];
      }

      where.team_id = { in: accessibleTeamIds };
    }

    if (status) {
      where.status = status;
    }

    if (position) {
      where.position = position;
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Construire le ORDER BY
    const allowedSortFields = ['first_name', 'last_name', 'jersey_number', 'position', 'status', 'created_at'];
    const orderBy = sortBy && allowedSortFields.includes(sortBy)
      ? { [sortBy]: order }
      : [{ jersey_number: 'asc' as const }, { last_name: 'asc' as const }];

    // Compter le total
    const total = await this.prisma.player.count({ where });

    // Récupérer les données paginées
    const data = await this.prisma.player.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        team: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer un joueur par ID
   */
  async findOne(id: string, userId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundException('Joueur non trouvé');
    }

    // Vérifier les permissions
    const canManage = await this.canManagePlayers(player.team_id, userId);
    if (!canManage) {
      throw new ForbiddenException('Vous n\'avez pas accès à ce joueur');
    }

    return player;
  }

  /**
   * Modifier un joueur (peut changer d'équipe via team_id)
   */
  async update(id: string, userId: string, updatePlayerDto: UpdatePlayerDto) {
    const player = await this.prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException('Joueur non trouvé');
    }

    // Vérifier les permissions sur l'équipe actuelle
    const canManageCurrent = await this.canManagePlayers(player.team_id, userId);
    if (!canManageCurrent) {
      throw new ForbiddenException('Seuls le coach, l\'assistant ou le président du club peuvent modifier un joueur');
    }

    // Si on change d'équipe, vérifier les permissions sur la nouvelle équipe
    if (updatePlayerDto.team_id && updatePlayerDto.team_id !== player.team_id) {
      const newTeam = await this.prisma.team.findUnique({
        where: { id: updatePlayerDto.team_id },
      });

      if (!newTeam) {
        throw new NotFoundException('Nouvelle équipe non trouvée');
      }

      const canManageNew = await this.canManagePlayers(updatePlayerDto.team_id, userId);
      if (!canManageNew) {
        throw new ForbiddenException('Vous n\'avez pas les permissions sur la nouvelle équipe');
      }
    }

    return this.prisma.player.update({
      where: { id },
      data: updatePlayerDto,
    });
  }

  /**
   * Supprimer un joueur
   */
  async remove(id: string, userId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException('Joueur non trouvé');
    }

    // Vérifier les permissions
    const canManage = await this.canManagePlayers(player.team_id, userId);
    if (!canManage) {
      throw new ForbiddenException('Seuls le coach, l\'assistant ou le président du club peuvent supprimer un joueur');
    }

    return this.prisma.player.delete({
      where: { id },
    });
  }
  
    // ==================== STATISTIQUES ====================

  /**
   * Récupérer les statistiques agrégées d'un joueur
   */
  async getPlayerStats(playerId: string, userId: string) {
    // 1. Vérifier que le joueur existe
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundException('Joueur non trouvé');
    }

    // 2. Vérifier les permissions
    const canManage = await this.canManagePlayers(player.team_id, userId);
    if (!canManage) {
      throw new ForbiddenException('Vous n\'avez pas accès aux stats de ce joueur');
    }

    // 3. Récupérer les convocations (MatchPlayer)
    const matchPlayers = await this.prisma.matchPlayer.findMany({
      where: { player_id: playerId },
    });

    const totalMatches = matchPlayers.length;
    const matchesAsStarter = matchPlayers.filter(mp => mp.status === 'STARTER').length;
    const matchesAsSubstitute = matchPlayers.filter(mp => mp.status === 'SUBSTITUTE').length;

    // 4. Récupérer tous les événements du joueur
    const events = await this.prisma.matchEvent.findMany({
      where: { player_id: playerId },
    });

    // 5. Compter par type d'événement
    const goals = events.filter(e => e.event_type === 'GOAL').length;
    const assists = events.filter(e => e.event_type === 'ASSIST').length;
    const yellowCards = events.filter(e => e.event_type === 'YELLOW_CARD').length;
    const redCards = events.filter(e => e.event_type === 'RED_CARD').length;
    const recoveries = events.filter(e => e.event_type === 'RECOVERY').length;
    const ballLosses = events.filter(e => e.event_type === 'BALL_LOSS').length;

    // 6. Buts par zone
    const goalEvents = events.filter(e => e.event_type === 'GOAL');
    const goalsByZone = {
      // Zones de grille 3×3 (utilisées par le sélecteur de match live)
      ATT_LEFT:   goalEvents.filter(e => e.zone === 'ATT_LEFT').length,
      ATT_CENTER: goalEvents.filter(e => e.zone === 'ATT_CENTER').length,
      ATT_RIGHT:  goalEvents.filter(e => e.zone === 'ATT_RIGHT').length,
      MID_LEFT:   goalEvents.filter(e => e.zone === 'MID_LEFT').length,
      MID_CENTER: goalEvents.filter(e => e.zone === 'MID_CENTER').length,
      MID_RIGHT:  goalEvents.filter(e => e.zone === 'MID_RIGHT').length,
      DEF_LEFT:   goalEvents.filter(e => e.zone === 'DEF_LEFT').length,
      DEF_CENTER: goalEvents.filter(e => e.zone === 'DEF_CENTER').length,
      DEF_RIGHT:  goalEvents.filter(e => e.zone === 'DEF_RIGHT').length,
      // Zones complémentaires
      BOX:    goalEvents.filter(e => e.zone === 'BOX').length,
      OUTSIDE: goalEvents.filter(e => e.zone === 'OUTSIDE').length,
      // Zones legacy (conservées pour compatibilité)
      LEFT:  goalEvents.filter(e => e.zone === 'LEFT').length,
      RIGHT: goalEvents.filter(e => e.zone === 'RIGHT').length,
      AXIS:  goalEvents.filter(e => e.zone === 'AXIS').length,
    };

    // 7. Buts par partie du corps
    const goalsByBodyPart = {
      LEFT_FOOT: goalEvents.filter(e => e.body_part === 'LEFT_FOOT').length,
      RIGHT_FOOT: goalEvents.filter(e => e.body_part === 'RIGHT_FOOT').length,
      HEAD: goalEvents.filter(e => e.body_part === 'HEAD').length,
    };

    return {
      player_id: player.id,
      player_name: `${player.last_name} ${player.first_name}`,
      total_matches: totalMatches,
      matches_as_starter: matchesAsStarter,
      matches_as_substitute: matchesAsSubstitute,
      goals,
      assists,
      yellow_cards: yellowCards,
      red_cards: redCards,
      recoveries,
      ball_losses: ballLosses,
      goals_by_zone: goalsByZone,
      goals_by_body_part: goalsByBodyPart,
    };
  }
}