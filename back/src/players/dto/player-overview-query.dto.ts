import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PlayerStatsPeriod {
  ALL = 'ALL',
  SEASON = 'SEASON',
  LAST_30_DAYS = 'LAST_30_DAYS',
}

export class PlayerOverviewQueryDto {
  @ApiProperty({ description: 'Équipe de l’effectif' })
  @IsUUID()
  teamId: string;

  @ApiPropertyOptional({
    enum: PlayerStatsPeriod,
    default: PlayerStatsPeriod.ALL,
  })
  @IsEnum(PlayerStatsPeriod)
  period: PlayerStatsPeriod = PlayerStatsPeriod.ALL;
}
