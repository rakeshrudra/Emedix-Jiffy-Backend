import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductSwil } from './entities/product-swil.entity';
import { SearchProductsDto } from './dto/search-products.dto';
import { ProductSearchQueryDto } from './dto/product-search-query.dto';
import { ProductDto } from './dto/product.dto';
import { ProductStockDto } from './dto/product-stock.dto';
import { parseInventoryFile } from './utils/inventory-upload.util';

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
        @InjectRepository(ProductSwil)
        private readonly productSwilRepository: Repository<ProductSwil>,
        private readonly dataSource: DataSource,
    ) { }

    async listProducts(dto: SearchProductsDto): Promise<ProductListResult> {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;

        const qb = this.productRepository
            .createQueryBuilder('p')
            .where('p.store_id = :store_id', { store_id: dto.store_id })
            .andWhere('p.status = :status', { status: ProductStatus.ENABLE })
            .andWhere('p.product_stock > 0')
            .orderBy('p.product_name', 'ASC')
            .skip(skip)
            .take(limit);

        if (dto.q?.trim()) {
            qb.andWhere(
                '(p.product_name LIKE :q OR p.product_composition LIKE :q)',
                { q: `%${dto.q.trim()}%` },
            );
        }

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

    async searchProducts(dto: ProductSearchQueryDto): Promise<Product[]> {
        const searchText = dto.q?.trim();

        if (!searchText) {
            throw new BadRequestException('q is required');
        }

        const qb = this.productRepository
            .createQueryBuilder('p')
            .where('p.status = :status', { status: ProductStatus.ENABLE })
            .andWhere('p.product_stock > 0')
            .andWhere(
                `(
                    LOWER(p.product_name) LIKE :q OR
                    LOWER(p.product_company) LIKE :q OR
                    LOWER(p.product_composition) LIKE :q
                )`,
                { q: `%${searchText.toLowerCase()}%` },
            )
            .orderBy('p.product_name', 'ASC')
            .take(20);

        if (dto.store_id?.trim()) {
            qb.andWhere('p.store_id = :store_id', { store_id: dto.store_id.trim() });
        }

        return qb.getMany();
    }

    /**
     * Finds a product by its ERP code within a store. Returns null if not found —
     * callers decide whether that's a 404 or a validation error.
     */
    async findByCode(store_id: string, product_code: string): Promise<Product | null> {
        return this.productRepository.findOne({
            where: { product_code: product_code, store_id: store_id },
        });
    }

    parseStock(product: Product): number {
        return Number(product.product_stock) || 0;
    }

    getEffectivePrice(product: Product): number {
        return Number(product.product_discount_price) || Number(product.product_price) || 0;
    }

    /**
     * Single source of truth for "can this many units of this product be ordered right now".
     * Throws BadRequestException with a user-facing message on failure.
     */
    assertAvailable(product: Product | null, productName: string, requestedQty: number): void {
        if (!product || product.status !== ProductStatus.ENABLE) {
            throw new BadRequestException(`"${productName}" is no longer available`);
        }

        const stock = this.parseStock(product);
        if (stock <= 0) {
            throw new BadRequestException(`"${productName}" is out of stock`);
        }
        if (requestedQty > stock) {
            throw new BadRequestException(
                `"${productName}" only has ${stock} unit(s) available (requested ${requestedQty})`,
            );
        }
    }

    /**
     * Same rule as assertAvailable, but returns issues instead of throwing —
     * used by cart validation, which needs to report every problem at once.
     */
    checkAvailability(product: Product | null, requestedQty: number): string[] {
        const issues: string[] = [];

        if (!product || product.status !== ProductStatus.ENABLE) {
            issues.push('Product is no longer available');
            return issues;
        }

        const stock = this.parseStock(product);
        if (stock <= 0) {
            issues.push('Out of stock');
        } else if (requestedQty > stock) {
            issues.push(`Only ${stock} unit(s) available`);
        }

        return issues;
    }

    // ─── ERP webhook writes (Swil, legacy — products_swil table) ────────────────

    async upsertFromErp(items: ProductDto[]): Promise<void> {
        await this.productSwilRepository.upsert(
            items.map((item) => ({
                store_id: item.store_id,
                product_name: item.product_name,
                product_code: item.product_code,
                product_company: item.product_company,
                hsn_code: item['HSN/SAC'],
                prescription_required: item.prescription_required,
                product_price: item.product_price,
                product_discount_price: item.product_discount_price,
                product_type: item.product_type,
                packaging_of_medicines: item.packaging_of_medicines,
                product_composition: item.product_composition,
                status: item.status,
                product_stock: item.product_stock,
                last_updated: item.last_updated,
            })),
            {
                conflictPaths: ['store_id', 'product_code'],
                skipUpdateIfNoValuesChanged: true,
            },
        );
    }

    async updateStockFromErp(items: ProductStockDto[]): Promise<void> {
        await this.productSwilRepository.upsert(
            items.map((item) => ({
                product_code: item.product_code,
                store_id: item.store_id,
                product_stock: item.product_stock,
            })),
            {
                conflictPaths: ['store_id', 'product_code'],
                skipUpdateIfNoValuesChanged: true,
            },
        );
    }

    // ─── Admin bulk inventory upload (live products table) ──────────────────

    async uploadInventory(
        store_id: string,
        file_buffer: Buffer,
    ): Promise<{ store_id: string; products_inserted: number; warnings: string[] }> {
        const { rows, warnings, fatal_error } = parseInventoryFile(file_buffer);

        if (fatal_error) {
            throw new BadRequestException({
                message: fatal_error,
            });
        }

        const INSERT_CHUNK_SIZE = 500;

        await this.dataSource.transaction(async (manager) => {
            await manager.delete(Product, { store_id: store_id });

            const products = rows.map((row) => ({
                store_id: store_id,
                product_code: row.product_code,
                product_name: row.product_name,
                product_type: row.product_type,
                product_stock: row.product_stock,
                product_price: row.product_price,
                product_discount_price: row.product_price,
                product_company: row.product_company,
                hsn_code: '',
                packaging_of_medicines: '',
                product_composition: '',
                prescription_required: true,
                status: ProductStatus.ENABLE,
            }));

            for (let i = 0; i < products.length; i += INSERT_CHUNK_SIZE) {
                const chunk = products.slice(i, i + INSERT_CHUNK_SIZE);
                await manager
                    .createQueryBuilder()
                    .insert()
                    .into(Product)
                    .values(chunk)
                    .execute();
            }
        });

        return { store_id: store_id, products_inserted: rows.length, warnings };
    }
}
