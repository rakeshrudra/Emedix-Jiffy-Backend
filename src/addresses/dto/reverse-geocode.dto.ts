import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class ReverseGeocodeDto {
  @ApiProperty({ example: 30.3165, description: 'Latitude from device GPS' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 78.0322, description: 'Longitude from device GPS' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
