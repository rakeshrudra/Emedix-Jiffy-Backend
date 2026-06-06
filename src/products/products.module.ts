import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product]),
        JwtModule.register({})
    ],
    controllers: [ProductsController],
    providers: [ProductsService, JwtAuthGuard],
    exports: [ProductsService],
})
export class ProductsModule { }
