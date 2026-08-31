import { IsEnum, IsOptional } from 'class-validator';
import { MatchPlayerStatus, MatchPresenceStatus } from './add-players-to-match.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMatchPlayerDto {
  @ApiPropertyOptional({ enum: MatchPlayerStatus, example: 'SUBSTITUTE', description: 'Nouveau rôle du joueur' })
  @IsOptional()
  @IsEnum(MatchPlayerStatus)
  status?: MatchPlayerStatus;

  @ApiPropertyOptional({ enum: MatchPresenceStatus, example: 'PRESENT', description: 'Nouvelle disponibilité du joueur' })
  @IsOptional()
  @IsEnum(MatchPresenceStatus)
  presence?: MatchPresenceStatus;
}
