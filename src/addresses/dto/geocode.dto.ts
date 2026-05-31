import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class GeocodeDto {
  @ApiProperty({
    example: 'MG Road, Andheri East, Mumbai',
    description: 'Free-text address query to forward geocode via Google Maps',
  })
  @IsNotEmpty({ message: 'Search query is required' })
  @IsString()
  @MinLength(3, { message: 'Query is too short' })
  @MaxLength(300)
  @Transform(({ value }) => value?.trim())
  query: string;
}
