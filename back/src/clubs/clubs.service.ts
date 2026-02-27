import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { AddClubMemberDto } from './dto/add-club-member.dto';
import { UpdateClubMemberRoleDto } from './dto/update-club-member-role.dto';
import { TransferPresidencyDto } from './dto/transfer-presidency.dto';
import { JoinClubDto } from './dto/join-club.dto';
import { PaginationQueryDto, PaginatedResult } from '../common/dto/pagination-query.dto';
import { club_role } from '@prisma/client';

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== HELPERS PRIVÉS ====================

  /**
   * Récupère le rôle d'un utilisateur dans un club
   * @returns Le rôle ou null si pas membre
   */
  private async getUserRoleInClub(clubId: string, userId: string): Promise<club_role | null> {
    const clubUser = await this.prisma.clubUser.findFirst({
      where: {
        club_id: clubId,
        user_id: userId,
      },
    });
    return clubUser?.role || null;
  }

  /**
   * Vérifie si un utilisateur est membre du club
   */
  private async isMemberOfClub(clubId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInClub(clubId, userId);
    return role !== null;
  }

  /**
   * Vérifie si un rôle peut gérer les membres (PRESIDENT ou RESPONSABLE)
   */
  private canManageMembers(role: club_role | null): boolean {
    return role === club_role.PRESIDENT || role === club_role.RESPONSABLE;
  }

  /**
   * Vérifie si un rôle peut modifier le club (PRESIDENT uniquement)
   */
  private canModifyClub(role: club_role | null): boolean {
    return role === club_role.PRESIDENT;
  }

  /**
   * Vérifie si currentUserRole peut changer le rôle vers targetRole
   * Hiérarchie: PRESIDENT > RESPONSABLE > COACH
   */
  private canChangeRole(currentUserRole: club_role, targetRole: club_role): boolean {
    if (currentUserRole === club_role.PRESIDENT) {
      return targetRole === club_role.RESPONSABLE || targetRole === club_role.COACH;
    }
    if (currentUserRole === club_role.RESPONSABLE) {
      return targetRole === club_role.COACH;
    }
    return false; // COACH ne peut rien changer
  }

  /**
   * Génère un code d'invitation lisible de 9 caractères alphanumériques
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0,O,I,1)
    let code = '';
    for (let i = 0; i < 9; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ==================== CRUD DE BASE ====================

  /**
   * Créer un club et ajouter automatiquement le créateur comme PRESIDENT
   */
  async create(createClubDto: CreateClubDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Générer un code d'invitation lisible (9 caractères alphanumériques)
      const inviteCode = this.generateInviteCode();

      // Créer le club
      const club = await tx.club.create({
        data: {
          name: createClubDto.name,
          city: createClubDto.city || null,
          logo: createClubDto.logo || null,
          invite_code: inviteCode,
        },
      });

      // Ajouter le créateur comme PRESIDENT
      await tx.clubUser.create({
        data: {
          club_id: club.id,
          user_id: userId,
          role: club_role.PRESIDENT,
        },
      });

      return club;
    });
  }

  /**
   * Lister tous les clubs dont l'utilisateur est membre
   * Avec pagination, recherche par nom et tri
   */
  async findAll(userId: string, paginationQuery: PaginationQueryDto = {}): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sortBy, order = 'asc', search } = paginationQuery;

    // Construire le WHERE dynamique
    const where: any = {
      user_id: userId,
    };

    if (search) {
      where.club = {
        name: { contains: search, mode: 'insensitive' },
      };
    }

    // Compter le total
    const total = await this.prisma.clubUser.count({ where });

    // Construire le ORDER BY
    const allowedSortFields = ['name', 'created_at'];
    const clubOrderBy = sortBy && allowedSortFields.includes(sortBy)
      ? { club: { [sortBy]: order } }
      : { club: { name: 'asc' as const } };

    const clubUsers = await this.prisma.clubUser.findMany({
      where,
      include: {
        club: {
          include: {
            _count: {
              select: {
                teams: true,
                clubUsers: true,
              },
            },
          },
        },
      },
      orderBy: clubOrderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = clubUsers.map((cu) => ({
      ...cu.club,
      myRole: cu.role,
    }));

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
   * Récupérer un club par ID (vérifie que l'utilisateur est membre)
   */
  async findOne(id: string, userId: string) {
    const isMember = await this.isMemberOfClub(id, userId);
    if (!isMember) {
      throw new ForbiddenException('Vous n\'êtes pas membre de ce club');
    }

    const club = await this.prisma.club.findUnique({
      where: { id },
      include: {
        clubUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        teams: true,
      },
    });

    if (!club) {
      throw new NotFoundException('Club non trouvé');
    }

    const userRole = await this.getUserRoleInClub(id, userId);

    return {
      ...club,
      myRole: userRole,
    };
  }

  /**
   * Modifier un club (PRESIDENT uniquement)
   */
  async update(id: string, userId: string, updateClubDto: UpdateClubDto) {
    const userRole = await this.getUserRoleInClub(id, userId);
    
    if (!this.canModifyClub(userRole)) {
      throw new ForbiddenException('Seul le président peut modifier le club');
    }

    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) {
      throw new NotFoundException('Club non trouvé');
    }

    return this.prisma.club.update({
      where: { id },
      data: updateClubDto,
    });
  }

  /**
   * Supprimer un club (PRESIDENT uniquement)
   */
  async remove(id: string, userId: string) {
    const userRole = await this.getUserRoleInClub(id, userId);
    
    if (!this.canModifyClub(userRole)) {
      throw new ForbiddenException('Seul le président peut supprimer le club');
    }

    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) {
      throw new NotFoundException('Club non trouvé');
    }

    return this.prisma.club.delete({
      where: { id },
    });
  }

  // ==================== GESTION DES MEMBRES ====================

  /**
   * Récupérer la liste des membres d'un club
   */
  async getMembers(clubId: string, userId: string) {
    const isMember = await this.isMemberOfClub(clubId, userId);
    if (!isMember) {
      throw new ForbiddenException('Vous n\'êtes pas membre de ce club');
    }

    return this.prisma.clubUser.findMany({
      where: { club_id: clubId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });
  }

  /**
   * Ajouter un membre au club (PRESIDENT ou RESPONSABLE)
   */
  async addMember(clubId: string, userId: string, addMemberDto: AddClubMemberDto) {
    const userRole = await this.getUserRoleInClub(clubId, userId);
    
    if (!this.canManageMembers(userRole)) {
      throw new ForbiddenException('Seuls le président et le responsable peuvent ajouter des membres');
    }

    // Vérifier que le club existe
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException('Club non trouvé');
    }

    // Vérifier que l'utilisateur à ajouter existe
    const userToAdd = await this.prisma.user.findUnique({ 
      where: { id: addMemberDto.userId } 
    });
    if (!userToAdd) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier qu'on n'ajoute pas un 2ème PRESIDENT
    if (addMemberDto.role === club_role.PRESIDENT) {
      const existingPresident = await this.prisma.clubUser.findFirst({
        where: {
          club_id: clubId,
          role: club_role.PRESIDENT,
        },
      });
      if (existingPresident) {
        throw new BadRequestException('Un président existe déjà. Utilisez la fonction de transfert de présidence.');
      }
    }

    // Vérifier que l'utilisateur n'est pas déjà membre
    const existingMember = await this.prisma.clubUser.findFirst({
      where: {
        club_id: clubId,
        user_id: addMemberDto.userId,
      },
    });
    if (existingMember) {
      throw new ConflictException('Cet utilisateur est déjà membre du club');
    }

    return this.prisma.clubUser.create({
      data: {
        club_id: clubId,
        user_id: addMemberDto.userId,
        role: addMemberDto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });
  }

  /**
   * Retirer un membre du club (PRESIDENT ou RESPONSABLE)
   * Règles: 
   * - Ne peut pas retirer le PRESIDENT (il doit transférer)
   * - RESPONSABLE ne peut pas retirer un autre RESPONSABLE
   */
  async removeMember(clubId: string, userId: string, memberIdToRemove: string) {
    const userRole = await this.getUserRoleInClub(clubId, userId);
    
    if (!this.canManageMembers(userRole)) {
      throw new ForbiddenException('Seuls le président et le responsable peuvent retirer des membres');
    }

    // Récupérer le membre à retirer
    const memberToRemove = await this.prisma.clubUser.findFirst({
      where: {
        club_id: clubId,
        user_id: memberIdToRemove,
      },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Membre non trouvé dans ce club');
    }

    // Empêcher de retirer le PRESIDENT
    if (memberToRemove.role === club_role.PRESIDENT) {
      throw new BadRequestException('Impossible de retirer le président. Il doit transférer sa présidence d\'abord.');
    }

    // Un RESPONSABLE ne peut pas retirer un autre RESPONSABLE (seul PRESIDENT peut)
    if (userRole === club_role.RESPONSABLE && memberToRemove.role === club_role.RESPONSABLE) {
      throw new ForbiddenException('Seul le président peut retirer un responsable');
    }

    await this.prisma.clubUser.deleteMany({
      where: {
        club_id: clubId,
        user_id: memberIdToRemove,
      },
    });
    
    return { message: 'Membre retiré avec succès' };
  }

  /**
   * Modifier le rôle d'un membre
   * Hiérarchie: PRESIDENT peut changer RESPONSABLE et COACH
   *             RESPONSABLE peut changer COACH
   *             COACH ne peut rien changer
   */
  async updateMemberRole(
    clubId: string, 
    userId: string, 
    memberIdToUpdate: string, 
    updateRoleDto: UpdateClubMemberRoleDto
  ) {
    const userRole = await this.getUserRoleInClub(clubId, userId);
    
    if (!userRole) {
      throw new ForbiddenException('Vous n\'êtes pas membre de ce club');
    }

    // Vérifier les permissions
    if (!this.canChangeRole(userRole, updateRoleDto.role)) {
      throw new ForbiddenException('Vous n\'avez pas les permissions pour définir ce rôle');
    }

    // Empêcher de créer un 2ème PRESIDENT
    if (updateRoleDto.role === club_role.PRESIDENT) {
      throw new BadRequestException('Utilisez la fonction de transfert de présidence pour nommer un nouveau président');
    }

    // Vérifier que le membre existe
    const memberToUpdate = await this.prisma.clubUser.findFirst({
      where: {
        club_id: clubId,
        user_id: memberIdToUpdate,
      },
    });

    if (!memberToUpdate) {
      throw new NotFoundException('Membre non trouvé dans ce club');
    }

    // Empêcher de changer le rôle du PRESIDENT
    if (memberToUpdate.role === club_role.PRESIDENT) {
      throw new BadRequestException('Impossible de changer le rôle du président. Utilisez la fonction de transfert.');
    }

    await this.prisma.clubUser.updateMany({
      where: {
        club_id: clubId,
        user_id: memberIdToUpdate,
      },
      data: {
        role: updateRoleDto.role,
      },
    });
    
    // Récupérer le membre mis à jour avec les infos user
    return this.prisma.clubUser.findFirst({
      where: {
        club_id: clubId,
        user_id: memberIdToUpdate,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });
  }

  /**
   * Transférer la présidence à un autre membre
   * L'ancien président devient RESPONSABLE
   */
  async transferPresidency(
    clubId: string, 
    currentPresidentId: string, 
    transferDto: TransferPresidencyDto
  ) {
    const currentPresidentRole = await this.getUserRoleInClub(clubId, currentPresidentId);
    
    if (currentPresidentRole !== club_role.PRESIDENT) {
      throw new ForbiddenException('Seul le président peut transférer sa présidence');
    }

    // Vérifier que le nouveau président est déjà membre
    const newPresidentRole = await this.getUserRoleInClub(clubId, transferDto.new_president_user_id);
    if (!newPresidentRole) {
      throw new BadRequestException('Le nouveau président doit déjà être membre du club');
    }

    // Transaction pour garantir l'atomicité
    return this.prisma.$transaction(async (tx) => {
      // 1. Ancien président devient RESPONSABLE
      await tx.clubUser.updateMany({
        where: {
          club_id: clubId,
          user_id: currentPresidentId,
        },
        data: {
          role: club_role.RESPONSABLE,
        },
      });

      // 2. Nouveau membre devient PRESIDENT
      await tx.clubUser.updateMany({
        where: {
          club_id: clubId,
          user_id: transferDto.new_president_user_id,
        },
        data: {
          role: club_role.PRESIDENT,
        },
      });

      return { message: 'Présidence transférée avec succès' };
    });
  }

  /**
   * Quitter un club
   * Le PRESIDENT ne peut pas quitter (il doit d'abord transférer)
   */
  async leaveClub(clubId: string, userId: string) {
    const userRole = await this.getUserRoleInClub(clubId, userId);
    
    if (!userRole) {
      throw new NotFoundException('Vous n\'êtes pas membre de ce club');
    }

    if (userRole === club_role.PRESIDENT) {
      throw new BadRequestException('Le président ne peut pas quitter le club. Transférez d\'abord votre présidence.');
    }

    await this.prisma.clubUser.deleteMany({
      where: {
        club_id: clubId,
        user_id: userId,
      },
    });
    
    return { message: 'Vous avez quitté le club avec succès' };
  }

  // ==================== REJOINDRE UN CLUB ====================

  /**
   * Rejoindre un club via son code d'invitation
   * L'utilisateur est ajouté en tant que COACH par défaut
   */
  async joinByCode(joinClubDto: JoinClubDto, userId: string) {
    const club = await this.prisma.club.findUnique({
      where: { invite_code: joinClubDto.invite_code },
    });

    if (!club) {
      throw new NotFoundException('Code d\'invitation invalide. Vérifiez le code et réessayez.');
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await this.prisma.clubUser.findFirst({
      where: {
        club_id: club.id,
        user_id: userId,
      },
    });

    if (existingMember) {
      throw new ConflictException('Vous êtes déjà membre de ce club');
    }

    // Ajouter l'utilisateur comme COACH par défaut
    await this.prisma.clubUser.create({
      data: {
        club_id: club.id,
        user_id: userId,
        role: club_role.COACH,
      },
    });

    return {
      message: `Vous avez rejoint le club "${club.name}" avec succès`,
      club: {
        id: club.id,
        name: club.name,
        city: club.city,
        logo: club.logo,
      },
    };
  }
}