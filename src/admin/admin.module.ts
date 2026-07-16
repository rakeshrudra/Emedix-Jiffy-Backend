import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresModule } from '../stores/stores.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Admin } from './entities/admin.entity';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([Admin]),
    StoresModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtAuthGuard],
  exports: [AdminService, AdminJwtAuthGuard],
})
export class AdminModule {}
