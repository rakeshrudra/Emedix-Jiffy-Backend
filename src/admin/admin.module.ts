import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresModule } from '../stores/stores.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Admin } from './entities/admin.entity';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { SsoAuthGuard } from '../common/guards/sso-auth.guard';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([Admin]),
    StoresModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtAuthGuard, AdminRolesGuard, SsoAuthGuard],
  exports: [AdminService, AdminJwtAuthGuard, AdminRolesGuard],
})
export class AdminModule {}
