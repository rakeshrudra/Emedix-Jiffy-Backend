import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductSwil } from './entities/product-swil.entity';
import { ProductsService } from './products.service';
import { ProductsController, AdminProductsController } from './products.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, ProductSwil]),
        JwtModule.register({})
    ],
    controllers: [ProductsController, AdminProductsController],
    providers: [ProductsService, JwtAuthGuard, AdminJwtAuthGuard],
    exports: [ProductsService],
})
export class ProductsModule { }
