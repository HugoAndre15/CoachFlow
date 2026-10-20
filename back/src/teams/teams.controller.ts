import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { TeamDashboardQueryDto } from './dto/team-dashboard-query.dto';

@ApiTags('Teams')
@ApiBearerAuth('JWT-auth')
@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // ==================== CRUD TEAM ====================

  @Post()
  @ApiOperation({ summary: 'Créer une équipe', description: 'Créer une équipe dans un club. Le créateur devient COACH par défaut' })
  @ApiResponse({ status: 201, description: 'Équipe créée' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  create(
    @Body() createTeamDto: CreateTeamDto,
    @CurrentUser() user: any
  ) {
    return this.teamsService.create(createTeamDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les équipes d\'un club', description: 'Liste paginée avec recherche et tri' })
  @ApiQuery({ name: 'clubId', description: 'UUID du club (obligatoire)', required: true })
  @ApiResponse({ status: 200, description: 'Liste paginée retournée' })
  findAll(
    @Query('clubId') clubId: string,
    @Query() paginationQuery: PaginationQueryDto,
    @CurrentUser() user: any
  ) {
    return this.teamsService.findAll(clubId, user.id, paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une équipe', description: 'Inclut membres, joueurs, rôles' })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Équipe trouvée' })
  @ApiResponse({ status: 404, description: 'Équipe non trouvée' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.teamsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une équipe', description: 'COACH de l\'équipe ou PRESIDENT du club' })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Équipe mise à jour' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateTeamDto: UpdateTeamDto
  ) {
    return this.teamsService.update(id, user.id, updateTeamDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une équipe', description: 'Cascade sur players, teamUsers, matches' })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Équipe supprimée' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.teamsService.remove(id, user.id);
  }

  // ==================== GESTION DES MEMBRES ====================

  @Get(':id/members')
  @ApiOperation({ summary: 'Lister les membres d\'une équipe', description: 'COACH et ASSISTANT_COACH' })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Liste des membres' })
  getMembers(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.teamsService.getMembers(id, user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Ajouter un membre à l\'équipe', description: 'COACH ou ASSISTANT_COACH uniquement. Pour les joueurs → POST /players' })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipe' })
  @ApiResponse({ status: 201, description: 'Membre ajouté' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  addMember(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() addMemberDto: AddTeamMemberDto
  ) {
    return this.teamsService.addMember(id, user.id, addMemberDto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Retirer un membre de l\'équipe' })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipe' })
  @ApiParam({ name: 'userId', description: 'UUID du membre à retirer' })
  @ApiResponse({ status: 200, description: 'Membre retiré' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  removeMember(
    @Param('id') teamId: string,
    @Param('userId') memberIdToRemove: string,
    @CurrentUser() user: any
  ) {
    return this.teamsService.removeMember(teamId, user.id, memberIdToRemove);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Changer le rôle d\'un membre', description: 'COACH ou ASSISTANT_COACH' })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipe' })
  @ApiParam({ name: 'userId', description: 'UUID du membre à modifier' })
  @ApiResponse({ status: 200, description: 'Rôle mis à jour' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  updateMemberRole(
    @Param('id') teamId: string,
    @Param('userId') memberIdToUpdate: string,
    @CurrentUser() user: any,
    @Body() updateRoleDto: UpdateTeamMemberRoleDto
  ) {
    return this.teamsService.updateMemberRole(
      teamId,
      user.id,
      memberIdToUpdate,
      updateRoleDto
    );
  }

  // ==================== STATISTIQUES ====================

  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Accueil équipe : match à suivre, effectif et bilan des matchs terminés' })
  getDashboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: TeamDashboardQueryDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.teamsService.getDashboard(id, user.id, query.period);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Statistiques globales d\'une équipe',
    description: 'Total matchs, buts, passes, cartons, moyenne par match, top buteur/passeur, historique. Accessible au COACH, ASSISTANT_COACH ou PRESIDENT uniquement.',
  })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Statistiques de l\'équipe retournées' })
  @ApiResponse({ status: 403, description: 'Non autorisé - Réservé au staff technique et au président' })
  @ApiResponse({ status: 404, description: 'Équipe non trouvée' })
  getTeamStatistics(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.getTeamStatistics(id, user.id);
  }

  @Get(':id/stats/players')
  @ApiOperation({
    summary: 'Statistiques individuelles des joueurs d\'une équipe',
    description: 'Buts, passes, cartons, récupérations, pertes de balle par joueur. Trié par nombre de buts décroissant. Accessible au COACH, ASSISTANT_COACH ou PRESIDENT uniquement.',
  })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Statistiques des joueurs retournées' })
  @ApiResponse({ status: 403, description: 'Non autorisé - Réservé au staff technique et au président' })
  @ApiResponse({ status: 404, description: 'Équipe non trouvée' })
  getTeamPlayersStatistics(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.getTeamPlayersStatistics(id, user.id);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Quitter une équipe', description: 'Même un COACH peut quitter' })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipe' })
  @ApiResponse({ status: 200, description: 'Équipe quittée' })
  leaveTeam(
    @Param('id') teamId: string,
    @CurrentUser() user: any
  ) {
    return this.teamsService.leaveTeam(teamId, user.id);
  }
}
