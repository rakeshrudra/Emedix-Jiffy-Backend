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
            .where('p.storeId = :storeId', { storeId: dto.store_id })
            .andWhere('p.status = :status', { status: ProductStatus.ENABLE })
            .andWhere('p.productStock > 0')
            .orderBy('p.productName', 'ASC')
            .skip(skip)
            .take(limit);

        if (dto.q?.trim()) {
            qb.andWhere(
                '(p.productName LIKE :q OR p.productComposition LIKE :q)',
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
            .andWhere('p.productStock > 0')
            .andWhere(
                `(
                    LOWER(p.productName) LIKE :q OR
                    LOWER(p.productCompany) LIKE :q OR
                    LOWER(p.productComposition) LIKE :q
                )`,
                { q: `%${searchText.toLowerCase()}%` },
            )
            .orderBy('p.productName', 'ASC')
            .take(20);

        if (dto.storeId?.trim()) {
            qb.andWhere('p.storeId = :storeId', { storeId: dto.storeId.trim() });
        }

        return qb.getMany();
    }

    /**
     * Finds a product by its ERP code within a store. Returns null if not found —
     * callers decide whether that's a 404 or a validation error.
     */
    async findByCode(storeId: string, productCode: string): Promise<Product | null> {
        return this.productRepository.findOne({ where: { productCode, storeId } });
    }

    parseStock(product: Product): number {
        return Number(product.productStock) || 0;
    }

    getEffectivePrice(product: Product): number {
        return Number(product.productDiscountPrice) || Number(product.productPrice) || 0;
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
                storeId: item.store_id,
                productName: item.product_name,
                productCode: item.product_code,
                productCompany: item.product_company,
                hsnCode: item['HSN/SAC'],
                prescriptionRequired: item.prescription_required,
                productPrice: item.product_price,
                productDiscountPrice: item.product_discount_price,
                productType: item.product_type,
                packagingOfMedicines: item.packaging_of_medicines,
                productComposition: item.product_composition,
                status: item.status,
                productStock: item.product_stock,
                lastUpdated: item.last_updated,
            })),
            {
                conflictPaths: ['storeId', 'productCode'],
                skipUpdateIfNoValuesChanged: true,
            },
        );
    }

    async updateStockFromErp(items: ProductStockDto[]): Promise<void> {
        await this.productSwilRepository.upsert(
            items.map((item) => ({
                productCode: item.product_code,
                storeId: item.store_id,
                productStock: item.product_stock,
            })),
            {
                conflictPaths: ['storeId', 'productCode'],
                skipUpdateIfNoValuesChanged: true,
            },
        );
    }

    // ─── Admin bulk inventory upload (live products table) ──────────────────

    async uploadInventory(
        storeId: string,
        fileBuffer: Buffer,
    ): Promise<{ store_id: string; products_inserted: number; warnings: string[] }> {
        const { rows, warnings, fatalError } = parseInventoryFile(fileBuffer);

        if (fatalError) {
            throw new BadRequestException({
                message: fatalError,
            });
        }

        const INSERT_CHUNK_SIZE = 500;

        await this.dataSource.transaction(async (manager) => {
            await manager.delete(Product, { storeId });

            const products = rows.map((row) => ({
                storeId,
                productCode: row.productCode,
                productName: row.productName,
                productType: row.productType,
                productStock: row.productStock,
                productPrice: row.productPrice,
                productDiscountPrice: row.productPrice,
                productCompany: row.productCompany,
                hsnCode: '',
                packagingOfMedicines: '',
                productComposition: '',
                prescriptionRequired: true,
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

        return { store_id: storeId, products_inserted: rows.length, warnings };
    }
}
