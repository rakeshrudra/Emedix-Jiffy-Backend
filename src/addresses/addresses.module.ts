import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { Address } from './entities/address.entity';
import { MapsModule } from '../maps/maps.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Address]),
    MapsModule,
    JwtModule.register({}),
  ],
  controllers: [AddressesController],
  providers: [AddressesService, JwtAuthGuard],
  exports: [AddressesService],
})
export class AddressesModule { }
