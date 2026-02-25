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
                storeId: item['Store Id'],
                nameToDisplay: item['NameToDisplay'],
                productId: item['Product Id'],
                hsnSac: item['HSN/SAC'],
                stock: item['Stock'],
                stockUnit: item['StockUnit'],
                stockValue: item['Stock Value'],
                category: item['Category'],
                marketingGroup: item['Marketing Group'],
                manufacturingCo: item['Manufacturing Co'],
                mrp: item['MRP'],
                rate: item['Rate'],
                status: item['Status'],
                schedule: item['Schedule'],
                lastUpdate: item['LastUpdate'],
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
