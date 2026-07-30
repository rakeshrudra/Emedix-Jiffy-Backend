import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({}),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
  ],
  controllers: [MapsController],
  providers: [MapsService, JwtAuthGuard],
  exports: [MapsService],
})
export class MapsModule { }
