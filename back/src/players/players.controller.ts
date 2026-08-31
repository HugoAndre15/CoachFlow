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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('Players')
@ApiBearerAuth('JWT-auth')
@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un joueur', description: 'Permissions: COACH, ASSISTANT_COACH ou PRESIDENT du club' })
  @ApiResponse({ status: 201, description: 'Joueur créé' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  @ApiResponse({ status: 409, description: 'Numéro de maillot déjà pris' })
  create(
    @Body() createPlayerDto: CreatePlayerDto,
    @CurrentUser() user: any
  ) {
    return this.playersService.create(createPlayerDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les joueurs d\'une équipe', description: 'Avec pagination, filtres par statut/position, recherche et tri' })
  @ApiQuery({ name: 'teamId', description: 'UUID de l\'équipe (obligatoire)', required: true })
  @ApiQuery({ name: 'status', description: 'Filtrer par statut (ACTIVE, INJURED, SUSPENDED, RETIRED)', required: false })
  @ApiQuery({ name: 'position', description: 'Filtrer par poste (GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD)', required: false })
  @ApiResponse({ status: 200, description: 'Liste paginée retournée' })
  findAll(
    @Query('teamId') teamId: string,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('position') position?: string,
    @CurrentUser() user?: any
  ) {
    return this.playersService.findAll(teamId, user.id, paginationQuery, status, position);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Statistiques d\'un joueur', description: 'Buts, passes, cartons, convocations, répartition par zone/pied' })
  @ApiParam({ name: 'id', description: 'UUID du joueur' })
  @ApiResponse({ status: 200, description: 'Statistiques retournées' })
  @ApiResponse({ status: 404, description: 'Joueur non trouvé' })
  getPlayerStats(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.playersService.getPlayerStats(id, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un joueur', description: 'Inclut infos team et club' })
  @ApiParam({ name: 'id', description: 'UUID du joueur' })
  @ApiResponse({ status: 200, description: 'Joueur trouvé' })
  @ApiResponse({ status: 404, description: 'Joueur non trouvé' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.playersService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un joueur', description: 'Y compris changer d\'équipe via team_id' })
  @ApiParam({ name: 'id', description: 'UUID du joueur' })
  @ApiResponse({ status: 200, description: 'Joueur mis à jour' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updatePlayerDto: UpdatePlayerDto
  ) {
    return this.playersService.update(id, user.id, updatePlayerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archiver un joueur', description: 'Le retire de l’effectif tout en conservant son historique de match' })
  @ApiParam({ name: 'id', description: 'UUID du joueur' })
  @ApiResponse({ status: 200, description: 'Joueur archivé' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.playersService.remove(id, user.id);
  }
}
