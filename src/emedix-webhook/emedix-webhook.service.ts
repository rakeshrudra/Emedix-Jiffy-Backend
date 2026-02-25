import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStock } from './entities/product-stock.entity.js';
import { ProductStockDto } from './dto/product-stock.dto.js';

@Injectable()
export class EmedixWebhookService {
    private readonly logger = new Logger(EmedixWebhookService.name);

    constructor(
        @InjectRepository(ProductStock)
        private readonly productStockRepository: Repository<ProductStock>,
    ) { }

    async handleProductStock(
        data: ProductStockDto | ProductStockDto[],
    ): Promise<{ received: number; message: string }> {
        const items = Array.isArray(data) ? data : [data];

        await this.productStockRepository.upsert(
            items.map((item) => ({
                storeId: item.storeId,
                nameToDisplay: item.nameToDisplay,
                productId: item.productId,
                hsnSac: item.hsnSac,
                stock: item.stock,
                stockUnit: item.stockUnit,
                stockValue: item.stockValue,
                category: item.category,
                marketingGroup: item.marketingGroup,
                manufacturingCo: item.manufacturingCo,
                mrp: item.mrp,
                rate: item.rate,
                status: item.status,
                schedule: item.schedule,
                lastUpdate: item.lastUpdate,
            })),
            {
                conflictPaths: ['storeId', 'productId'],
                skipUpdateIfNoValuesChanged: true,
            },
        );

        this.logger.log(`Upserted ${items.length} product stock record(s)`);

        return {
            received: items.length,
            message: `Successfully upserted ${items.length} product stock record(s)`,
        };
    }
}
