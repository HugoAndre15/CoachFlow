import { IsArray, ArrayNotEmpty, ValidateNested, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MatchPlayerStatus {
  STARTER = 'STARTER',
  SUBSTITUTE = 'SUBSTITUTE',
}

export enum MatchPresenceStatus {
  UNKNOWN = 'UNKNOWN',
  PRESENT = 'PRESENT',
  UNCERTAIN = 'UNCERTAIN',
  ABSENT = 'ABSENT',
}

export class PlayerToAddDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID du joueur' })
  @IsUUID()
  player_id: string;

  @ApiProperty({ enum: MatchPlayerStatus, example: 'STARTER', description: 'Titulaire ou remplaçant' })
  @IsEnum(MatchPlayerStatus)
  status: MatchPlayerStatus;

  @ApiPropertyOptional({
    enum: MatchPresenceStatus,
    example: MatchPresenceStatus.PRESENT,
    description: 'Disponibilité du joueur pour le match',
  })
  @IsOptional()
  @IsEnum(MatchPresenceStatus)
  presence?: MatchPresenceStatus;
}

export class AddPlayersToMatchDto {
  @ApiProperty({ type: [PlayerToAddDto], description: 'Liste des joueurs de la feuille de match' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PlayerToAddDto)
  players: PlayerToAddDto[];
}
