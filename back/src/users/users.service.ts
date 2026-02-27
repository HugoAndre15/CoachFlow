import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginationQueryDto, PaginatedResult } from '../common/dto/pagination-query.dto';
import * as bcrypt from 'bcrypt';

const safeResponseFields = {
    id: true,
    email: true,
    first_name: true,
    last_name: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password_hash: hashedPassword,
          first_name: createUserDto.first_name,
          last_name: createUserDto.last_name,
        },
        select: {
            ...safeResponseFields,
        },
    });
  }

  async findAll(paginationQuery: PaginationQueryDto = {}): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, sortBy, order = 'asc', search } = paginationQuery;

    // Construire le WHERE dynamique
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Construire le ORDER BY
    const allowedSortFields = ['email', 'first_name', 'last_name', 'created_at'];
    const orderBy = sortBy && allowedSortFields.includes(sortBy)
      ? { [sortBy]: order }
      : { last_name: 'asc' as const };

    // Compter le total
    const total = await this.prisma.user.count({ where });

    // Récupérer les données paginées
    const data = await this.prisma.user.findMany({
      where,
      select: {
        ...safeResponseFields,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        ...safeResponseFields,
      },
    });
  }

  // Méthode pour l'authentification qui inclut le password_hash
  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        ...safeResponseFields,
      },
    });
  }

  findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async getUserClubs(userId: string) {
    const clubUsers = await this.prisma.clubUser.findMany({
      where: { user_id: userId },
      select: {
        role: true,
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            logo: true,
            invite_code: true,
            created_at: true,
          },
        },
      },
    });

    return clubUsers.map(cu => ({
      ...cu.club,
      role: cu.role,
    }));
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
        where: { id },
        data: updateUserDto as any,
        select: {
            ...safeResponseFields,
        },
    });
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    // Récupérer l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.current_password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(updatePasswordDto.new_password, 10);

    // Mettre à jour le mot de passe
    return this.prisma.user.update({
      where: { id },
      data: {
        password_hash: hashedPassword,
      },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: {
        ...safeResponseFields,
      },
    });
  }
}
