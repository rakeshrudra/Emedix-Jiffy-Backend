import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppVersion } from './entities/app-version.entity';
import { AppVersionService } from './app-version.service';
import { AppVersionController } from './app-version.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppVersion]),
    ConfigModule,
    JwtModule.register({}),
  ],
  controllers: [AppVersionController],
  providers: [AppVersionService],
})
export class AppVersionModule {}
