import { IsNotEmpty, IsEnum, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { opponent_event_type } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOpponentEventDto {
  @ApiProperty({ enum: ['GOAL', 'YELLOW_CARD', 'RED_CARD'], example: 'GOAL', description: 'Type d\'événement adverse' })
  @IsEnum(opponent_event_type)
  @IsNotEmpty()
  event_type: opponent_event_type;

  @ApiProperty({ example: 42, description: 'Minute de l\'événement (0-120)', minimum: 0, maximum: 120 })
  @IsInt()
  @Min(0)
  @Max(120)
  minute: number;

  @ApiPropertyOptional({ example: '9', description: 'Numéro de maillot du joueur adverse' })
  @IsOptional()
  @IsString()
  jersey_number?: string;
}
