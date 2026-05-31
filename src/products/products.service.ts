import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../emedix-webhook/entities/product.entity';
import { SearchProductsDto } from './dto/search-products.dto';

export interface ProductListResult {
    data: Product[];
    total: number;
    page: number;
    limit: number;
}

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) {}

    async listProducts(dto: SearchProductsDto): Promise<ProductListResult> {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;

        const qb = this.productRepository
            .createQueryBuilder('p')
            .where('p.storeId = :storeId', { storeId: dto.store_id })
            .andWhere('p.status = :status', { status: 'Enable' })
            .andWhere('CAST(p.productStock AS UNSIGNED) > 0')
            .orderBy('p.productName', 'ASC')
            .skip(skip)
            .take(limit);

        const [data, total] = await qb.getManyAndCount();

        return { data, total, page, limit };
    }

    async getProduct(id: number): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }
}
