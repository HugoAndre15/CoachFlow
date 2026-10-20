import { IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlayerStatsPeriod } from '../../players/dto/player-overview-query.dto';

export class TeamDashboardQueryDto {
  @ApiPropertyOptional({
    enum: PlayerStatsPeriod,
    default: PlayerStatsPeriod.SEASON,
  })
  @IsEnum(PlayerStatsPeriod)
  period: PlayerStatsPeriod = PlayerStatsPeriod.SEASON;
}
