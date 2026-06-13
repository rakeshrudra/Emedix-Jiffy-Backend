import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MapsController],
  providers: [MapsService, JwtAuthGuard],
  exports: [MapsService],
})
export class MapsModule {}
