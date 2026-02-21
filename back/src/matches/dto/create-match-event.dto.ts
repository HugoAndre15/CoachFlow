import { IsUUID, IsNotEmpty, IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';
import { match_event_type, field_zone, body_part } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMatchEventDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID du joueur concerné' })
  @IsUUID()
  @IsNotEmpty()
  player_id: string;

  @ApiProperty({ enum: ['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'RECOVERY', 'BALL_LOSS', 'SUBSTITUTION'], example: 'GOAL', description: 'Type d\'événement' })
  @IsEnum(match_event_type)
  event_type: match_event_type;

  @ApiProperty({ example: 42, description: 'Minute de l\'événement (0-120)', minimum: 0, maximum: 120 })
  @IsInt()
  @Min(0)
  @Max(120)
  minute: number;

  @ApiPropertyOptional({
    enum: ['DEF_LEFT', 'DEF_CENTER', 'DEF_RIGHT', 'MID_LEFT', 'MID_CENTER', 'MID_RIGHT', 'ATT_LEFT', 'ATT_CENTER', 'ATT_RIGHT', 'BOX', 'OUTSIDE', 'LEFT', 'RIGHT', 'AXIS'],
    example: 'MID_CENTER',
    description: 'Zone du terrain (3×3 grille + surface + extérieur)',
  })
  @IsOptional()
  @IsEnum(field_zone)
  zone?: field_zone;

  @ApiPropertyOptional({ enum: ['LEFT_FOOT', 'RIGHT_FOOT', 'HEAD'], example: 'RIGHT_FOOT', description: 'Partie du corps' })
  @IsOptional()
  @IsEnum(body_part)
  body_part?: body_part;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'UUID d\'un événement lié (ex: ASSIST → GOAL)' })
  @IsOptional()
  @IsUUID()
  related_event_id?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'UUID du joueur entrant (pour SUBSTITUTION)' })
  @IsOptional()
  @IsUUID()
  related_player_id?: string;
}