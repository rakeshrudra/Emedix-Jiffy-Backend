import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyFirebaseTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
    description: 'Firebase ID Token obtained from the client after OTP verification',
  })
  @IsString()
  @IsNotEmpty({ message: 'Firebase ID token is required' })
  idToken: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
    description: 'Refresh token received from the verify-token response',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refresh_token: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'Rahul Sharma', description: 'User display name' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @MinLength(2, { message: 'Name is too short' })
  @MaxLength(100, { message: 'Name is too long' })
  @Transform(({ value }) => value?.trim())
  name: string;
}
