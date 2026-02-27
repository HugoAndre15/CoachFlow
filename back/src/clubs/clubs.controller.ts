import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Query 
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { AddClubMemberDto } from './dto/add-club-member.dto';
import { UpdateClubMemberRoleDto } from './dto/update-club-member-role.dto';
import { TransferPresidencyDto } from './dto/transfer-presidency.dto';
import { JoinClubDto } from './dto/join-club.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('Clubs')
@ApiBearerAuth('JWT-auth')
@Controller('clubs')
@UseGuards(JwtAuthGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  // ==================== CRUD CLUB ====================

  @Post()
  @ApiOperation({ summary: 'Créer un club', description: 'L\'utilisateur connecté devient automatiquement PRESIDENT' })
  @ApiResponse({ status: 201, description: 'Club créé avec succès' })
  create(
    @Body() createClubDto: CreateClubDto,
    @CurrentUser() user: any
  ) {
    return this.clubsService.create(createClubDto, user.id);
  }

  @Post('join')
  @ApiOperation({ summary: 'Rejoindre un club par code d\'invitation', description: 'L\'utilisateur est ajouté en tant que COACH par défaut' })
  @ApiResponse({ status: 201, description: 'Club rejoint avec succès' })
  @ApiResponse({ status: 404, description: 'Code d\'invitation invalide' })
  @ApiResponse({ status: 409, description: 'Déjà membre du club' })
  joinByCode(
    @Body() joinClubDto: JoinClubDto,
    @CurrentUser() user: any
  ) {
    return this.clubsService.joinByCode(joinClubDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister mes clubs', description: 'Liste paginée de tous les clubs dont je suis membre' })
  @ApiResponse({ status: 200, description: 'Liste paginée retournée' })
  findAll(
    @CurrentUser() user: any,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.clubsService.findAll(user.id, paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un club', description: 'Inclut les membres, teams et mon rôle' })
  @ApiParam({ name: 'id', description: 'UUID du club' })
  @ApiResponse({ status: 200, description: 'Club trouvé' })
  @ApiResponse({ status: 403, description: 'Non membre du club' })
  @ApiResponse({ status: 404, description: 'Club non trouvé' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.clubsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un club', description: 'Réservé au PRESIDENT' })
  @ApiParam({ name: 'id', description: 'UUID du club' })
  @ApiResponse({ status: 200, description: 'Club mis à jour' })
  @ApiResponse({ status: 403, description: 'Non autorisé (PRESIDENT uniquement)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateClubDto: UpdateClubDto
  ) {
    return this.clubsService.update(id, user.id, updateClubDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un club', description: 'Cascade sur teams et membres. Réservé au PRESIDENT' })
  @ApiParam({ name: 'id', description: 'UUID du club' })
  @ApiResponse({ status: 200, description: 'Club supprimé' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.clubsService.remove(id, user.id);
  }

  // ==================== GESTION DES MEMBRES ====================

  @Get(':id/members')
  @ApiOperation({ summary: 'Lister les membres d\'un club' })
  @ApiParam({ name: 'id', description: 'UUID du club' })
  @ApiResponse({ status: 200, description: 'Liste des membres' })
  getMembers(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.clubsService.getMembers(id, user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Ajouter un membre au club', description: 'Accessible au PRESIDENT et RESPONSABLE' })
  @ApiParam({ name: 'id', description: 'UUID du club' })
  @ApiResponse({ status: 201, description: 'Membre ajouté' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  @ApiResponse({ status: 409, description: 'Utilisateur déjà membre' })
  addMember(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() addMemberDto: AddClubMemberDto
  ) {
    return this.clubsService.addMember(id, user.id, addMemberDto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Retirer un membre du club', description: 'Ne peut pas retirer le PRESIDENT' })
  @ApiParam({ name: 'id', description: 'UUID du club' })
  @ApiParam({ name: 'userId', description: 'UUID du membre à retirer' })
  @ApiResponse({ status: 200, description: 'Membre retiré' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  removeMember(
    @Param('id') clubId: string,
    @Param('userId') memberIdToRemove: string,
    @CurrentUser() user: any
  ) {
    return this.clubsService.removeMember(clubId, user.id, memberIdToRemove);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Changer le rôle d\'un membre', description: 'Hiérarchie: PRESIDENT > RESPONSABLE > COACH' })
  @ApiParam({ name: 'id', description: 'UUID du club' })
  @ApiParam({ name: 'userId', description: 'UUID du membre à modifier' })
  @ApiResponse({ status: 200, description: 'Rôle mis à jour' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  updateMemberRole(
    @Param('id') clubId: string,
    @Param('userId') memberIdToUpdate: string,
    @CurrentUser() user: any,
    @Body() updateRoleDto: UpdateClubMemberRoleDto
  ) {
    return this.clubsService.updateMemberRole(
      clubId, 
      user.id, 
      memberIdToUpdate, 
      updateRoleDto
    );
  }

  // ==================== ACTIONS SPÉCIALES ====================

  @Post(':id/transfer-presidency')
  @ApiOperation({ summary: 'Transférer la présidence', description: 'L\'ancien président devient RESPONSABLE. Réservé au PRESIDENT' })
  @ApiParam({ name: 'id', description: 'UUID du club' })
  @ApiResponse({ status: 200, description: 'Présidence transférée' })
  @ApiResponse({ status: 403, description: 'Non autorisé (PRESIDENT uniquement)' })
  transferPresidency(
    @Param('id') clubId: string,
    @CurrentUser() user: any,
    @Body() transferDto: TransferPresidencyDto
  ) {
    return this.clubsService.transferPresidency(clubId, user.id, transferDto);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Quitter un club', description: 'Le PRESIDENT ne peut pas quitter (doit transférer d\'abord)' })
  @ApiParam({ name: 'id', description: 'UUID du club' })
  @ApiResponse({ status: 200, description: 'Club quitté' })
  @ApiResponse({ status: 403, description: 'Le PRESIDENT ne peut pas quitter' })
  leaveClub(
    @Param('id') clubId: string,
    @CurrentUser() user: any
  ) {
    return this.clubsService.leaveClub(clubId, user.id);
  }
}