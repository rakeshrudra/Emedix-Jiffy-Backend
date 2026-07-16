import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AdminRefreshTokenDto {
  @ApiProperty({ example: '<refresh-token>' })
  @IsString()
  refresh_token: string;
}
