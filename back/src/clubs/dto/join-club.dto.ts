import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinClubDto {
    @ApiProperty({ example: 'abc123-uuid', description: 'Code d\'invitation du club' })
    @IsString()
    @IsNotEmpty()
    invite_code: string;
}
