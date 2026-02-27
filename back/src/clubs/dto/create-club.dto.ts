import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClubDto {
    @ApiProperty({ example: 'FC Parisien', description: 'Nom du club (min 3 caractères)', minLength: 3 })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name: string;

    @ApiPropertyOptional({ example: 'Paris', description: 'Ville du club' })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiPropertyOptional({ description: 'Logo du club encodé en base64 (data URI)' })
    @IsString()
    @IsOptional()
    logo?: string;
}