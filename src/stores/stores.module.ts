import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { Store } from './entities/store.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store]),
    JwtModule.register({}),
  ],
  controllers: [StoresController],
  providers: [StoresService, JwtAuthGuard, ApiKeyGuard],
  exports: [StoresService],
})
export class StoresModule {}
