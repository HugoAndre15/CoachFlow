import { Controller, Get, Body, Patch, Param, Delete, UseGuards, ForbiddenException, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard) 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mon profil', description: 'Récupérer le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil retourné' })
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Get('me/clubs')
  @ApiOperation({ summary: 'Mes clubs', description: 'Récupérer les clubs de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Liste des clubs retournée' })
  getMyClubs(@CurrentUser() user: any) {
    return this.usersService.getUserClubs(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Modifier mon profil', description: 'Modifier son propre profil (email, nom, prénom)' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Modifier mon mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe mis à jour' })
  @ApiResponse({ status: 400, description: 'Mot de passe actuel incorrect' })
  updateMyPassword(
    @CurrentUser() user: any,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    return this.usersService.updatePassword(user.id, updatePasswordDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les utilisateurs', description: 'Liste paginée de tous les utilisateurs' })
  @ApiResponse({ status: 200, description: 'Liste paginée retournée' })
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.usersService.findAll(paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un utilisateur' })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur trouvé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // Modifier un utilisateur (vérifie que c'est bien son propre compte)
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un utilisateur', description: 'Vérifie que c\'est bien son propre compte' })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto
  ) {
    if (user.id !== id) {
      throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil');
    }
    return this.usersService.update(id, updateUserDto);
  }

  // Modifier le mot de passe (vérifie que c'est bien son propre compte)
  @Patch(':id/password')
  @ApiOperation({ summary: 'Modifier le mot de passe d\'un utilisateur' })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Mot de passe mis à jour' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  updatePassword(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    if (user.id !== id) {
      throw new ForbiddenException('Vous ne pouvez modifier que votre propre mot de passe');
    }
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  // Supprimer un compte (vérifie que c'est bien son propre compte)
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
  @ApiResponse({ status: 403, description: 'Accès interdit' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    if (user.id !== id) {
      throw new ForbiddenException('Vous ne pouvez supprimer que votre propre compte');
    }
    return this.usersService.remove(id);
  }
}
