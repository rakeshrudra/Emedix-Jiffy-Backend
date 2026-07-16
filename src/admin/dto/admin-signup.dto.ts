import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AdminSignupDto {
  @ApiProperty({ example: 'shaikpet_admin' })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  username: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({ example: '2' })
  @IsString()
  store_id: string;
}
