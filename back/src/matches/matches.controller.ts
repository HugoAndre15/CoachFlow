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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UpdateMatchStatusDto } from './dto/update-match-status.dto';
import { AddPlayersToMatchDto } from './dto/add-players-to-match.dto';
import { UpdateMatchPlayerDto } from './dto/update-match-player.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { UpdateMatchEventDto } from './dto/update-match-event.dto';
import { CreateOpponentEventDto } from './dto/create-opponent-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('Matches')
@ApiBearerAuth('JWT-auth')
@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un match', description: 'Status UPCOMING par défaut' })
  @ApiResponse({ status: 201, description: 'Match créé' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  create(
    @Body() createMatchDto: CreateMatchDto,
    @CurrentUser() user: any
  ) {
    return this.matchesService.create(createMatchDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les matchs d\'une équipe', description: 'Avec pagination, filtres par statut/dates, recherche et tri' })
  @ApiQuery({ name: 'teamId', description: 'UUID de l\'équipe (obligatoire)', required: true })
  @ApiQuery({ name: 'status', description: 'Filtrer par statut (UPCOMING, LIVE, FINISHED)', required: false })
  @ApiQuery({ name: 'from', description: 'Date de début (ISO 8601)', required: false })
  @ApiQuery({ name: 'to', description: 'Date de fin (ISO 8601)', required: false })
  @ApiResponse({ status: 200, description: 'Liste paginée retournée' })
  findAll(
    @Query('teamId') teamId: string,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @CurrentUser() user?: any
  ) {
    return this.matchesService.findAll(teamId, user.id, paginationQuery, status, from, to);
  }

  // ==================== GESTION DES JOUEURS CONVOQUÉS ====================

  @Post(':id/players')
  @ApiOperation({ summary: 'Convoquer des joueurs', description: 'Ajouter des joueurs à la feuille de match' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiResponse({ status: 201, description: 'Joueurs convoqués' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  addPlayersToMatch(
    @Param('id') id: string,
    @Body() addPlayersDto: AddPlayersToMatchDto,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.addPlayersToMatch(id, addPlayersDto, user.id);
  }

  @Get(':id/players')
  @ApiOperation({ summary: 'Joueurs convoqués', description: 'Liste triée par status (STARTER puis SUBSTITUTE)' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiResponse({ status: 200, description: 'Liste des joueurs convoqués' })
  getMatchPlayers(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.getMatchPlayers(id, user.id);
  }

  @Patch(':id/players/:playerId')
  @ApiOperation({ summary: 'Modifier le status d\'un joueur convoqué', description: 'STARTER ↔ SUBSTITUTE' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiParam({ name: 'playerId', description: 'UUID du joueur' })
  @ApiResponse({ status: 200, description: 'Status mis à jour' })
  updateMatchPlayerStatus(
    @Param('id') id: string,
    @Param('playerId') playerId: string,
    @Body() updateDto: UpdateMatchPlayerDto,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.updateMatchPlayerStatus(id, playerId, updateDto, user.id);
  }

  @Delete(':id/players/:playerId')
  @ApiOperation({ summary: 'Retirer un joueur de la convocation', description: 'Bloqué si le joueur a des événements' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiParam({ name: 'playerId', description: 'UUID du joueur' })
  @ApiResponse({ status: 200, description: 'Joueur retiré' })
  @ApiResponse({ status: 400, description: 'Joueur a des événements enregistrés' })
  removePlayerFromMatch(
    @Param('id') id: string,
    @Param('playerId') playerId: string,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.removePlayerFromMatch(id, playerId, user.id);
  }

  // ==================== GESTION DES ÉVÉNEMENTS ====================

  @Post(':id/events')
  @ApiOperation({ summary: 'Ajouter un événement', description: 'Si 2ème YELLOW_CARD → RED_CARD automatique' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiResponse({ status: 201, description: 'Événement créé' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  addEventToMatch(
    @Param('id') id: string,
    @Body() createEventDto: CreateMatchEventDto,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.addEventToMatch(id, createEventDto, user.id);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Événements du match', description: 'Triés par minute croissante' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiResponse({ status: 200, description: 'Liste des événements' })
  getMatchEvents(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.getMatchEvents(id, user.id);
  }

  @Patch(':id/events/:eventId')
  @ApiOperation({ summary: 'Modifier un événement' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiParam({ name: 'eventId', description: 'UUID de l\'événement' })
  @ApiResponse({ status: 200, description: 'Événement mis à jour' })
  updateMatchEvent(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @Body() updateEventDto: UpdateMatchEventDto,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.updateMatchEvent(id, eventId, updateEventDto, user.id);
  }

  @Delete(':id/events/:eventId')
  @ApiOperation({ summary: 'Supprimer un événement', description: 'Si GOAL → supprime aussi les ASSIST liés' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiParam({ name: 'eventId', description: 'UUID de l\'événement' })
  @ApiResponse({ status: 200, description: 'Événement supprimé' })
  removeMatchEvent(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.removeMatchEvent(id, eventId, user.id);
  }

  // ==================== ÉVÉNEMENTS ADVERSES ====================

  @Post(':id/opponent-events')
  @ApiOperation({ summary: 'Ajouter un événement adverse', description: 'GOAL, YELLOW_CARD ou RED_CARD de l\'équipe adverse' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiResponse({ status: 201, description: 'Événement adverse créé' })
  addOpponentEvent(
    @Param('id') id: string,
    @Body() dto: CreateOpponentEventDto,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.addOpponentEvent(id, dto, user.id);
  }

  @Get(':id/opponent-events')
  @ApiOperation({ summary: 'Événements adverses du match' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiResponse({ status: 200, description: 'Liste des événements adverses' })
  getOpponentEvents(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.getOpponentEvents(id, user.id);
  }

  @Delete(':id/opponent-events/:eventId')
  @ApiOperation({ summary: 'Supprimer un événement adverse' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiParam({ name: 'eventId', description: 'UUID de l\'événement adverse' })
  @ApiResponse({ status: 200, description: 'Événement adverse supprimé' })
  removeOpponentEvent(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.removeOpponentEvent(id, eventId, user.id);
  }

  // ==================== STATISTIQUES ====================

  @Get(':id/stats')
  @ApiOperation({ 
    summary: 'Statistiques d\'un match',
    description: 'Buts, passes, cartons, récupérations, pertes de balle, top buteur, top passeur, chronologie. Accessible au COACH, ASSISTANT_COACH ou PRESIDENT uniquement.',
  })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiResponse({ status: 200, description: 'Statistiques du match retournées' })
  @ApiResponse({ status: 403, description: 'Non autorisé - Réservé au staff technique et au président' })
  @ApiResponse({ status: 404, description: 'Match non trouvé' })
  getMatchStatistics(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.getMatchStatistics(id, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Changer le statut du match', description: 'UPCOMING → LIVE → FINISHED (pas de retour)' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  @ApiResponse({ status: 400, description: 'Transition de statut invalide' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateStatusDto: UpdateMatchStatusDto
  ) {
    return this.matchesService.updateStatus(id, user.id, updateStatusDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un match', description: 'Inclut team, club, événements avec joueurs, score calculé' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiResponse({ status: 200, description: 'Match trouvé' })
  @ApiResponse({ status: 404, description: 'Match non trouvé' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.matchesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un match', description: 'Modifier opponent, location, date. Le status se modifie via /status' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiResponse({ status: 200, description: 'Match mis à jour' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateMatchDto: UpdateMatchDto
  ) {
    return this.matchesService.update(id, user.id, updateMatchDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un match', description: 'Cascade sur les événements. COACH ou PRESIDENT uniquement' })
  @ApiParam({ name: 'id', description: 'UUID du match' })
  @ApiResponse({ status: 200, description: 'Match supprimé' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.matchesService.remove(id, user.id);
  }
}