import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { StoresService } from './stores.service';
import { StoresController, SuperAdminStoresController } from './stores.controller';
import { Store } from './entities/store.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store]),
    JwtModule.register({}),
  ],
  controllers: [StoresController, SuperAdminStoresController],
  providers: [StoresService, JwtAuthGuard, ApiKeyGuard, AdminJwtAuthGuard, AdminRolesGuard],
  exports: [StoresService],
})
export class StoresModule {}
