import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

const SEMVER = /^\d+\.\d+\.\d+$/;

export class UpdateAppVersionDto {
  @ApiPropertyOptional({ example: '1.2.0' })
  @IsOptional()
  @IsString()
  @Matches(SEMVER, { message: 'min_supported_version must be semver (e.g. 1.2.0)' })
  min_supported_version?: string;

  @ApiPropertyOptional({ example: '1.4.0' })
  @IsOptional()
  @IsString()
  @Matches(SEMVER, { message: 'latest_version must be semver (e.g. 1.4.0)' })
  latest_version?: string;

  @ApiPropertyOptional({
    example:
      'https://play.google.com/store/apps/details?id=com.managix.emedixjifi',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  store_url?: string;

  @ApiPropertyOptional({ example: '- Fixed login issue\n- Faster order sync' })
  @IsOptional()
  @IsString()
  release_notes?: string;
}
