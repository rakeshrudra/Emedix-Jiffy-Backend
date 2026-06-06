import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductDto } from '../products/dto/product.dto';
import { ProductStockDto } from '../products/dto/product-stock.dto';
import { Order } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class EmedixWebhookService {
    private readonly logger = new Logger(EmedixWebhookService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        private readonly ordersService: OrdersService,
    ) {}

    // ── Product Add / Update ──
    async handleProduct(data: ProductDto | ProductDto[]): Promise<{ received: number; message: string }> {
        const items = Array.isArray(data) ? data : [data];

        try {
            await this.productRepository.upsert(
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
            this.logger.log(`Upserted ${items.length} product(s)`);
        } catch (error) {
            if (error.message.includes('entity id is not set')) {
                this.logger.warn('Identical data posted for product(s) - no changes applied.');
            } else {
                throw error;
            }
        }

        return {
            received: items.length,
            message: `Successfully processed ${items.length} product(s)`,
        };
    }

    // ── Product Stock Upload ──
    async handleProductStock(data: ProductStockDto | ProductStockDto[]): Promise<{ received: number; message: string }> {
        const items = Array.isArray(data) ? data : [data];

        try {
            await this.productRepository.upsert(
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
            this.logger.log(`Upserted stock for ${items.length} product(s)`);
        } catch (error) {
            if (error.message.includes('entity id is not set')) {
                this.logger.warn('Identical stock data posted - no changes applied.');
            } else {
                throw error;
            }
        }

        return {
            received: items.length,
            message: `Successfully processed stock for ${items.length} product(s)`,
        };
    }

    async handlePendingOrders(storeId: string) {
        const orders = await this.ordersService.fetchPendingOrders(storeId);
        return {
            count: orders.length,
            orders: orders.map((o) => this.formatOrderForErp(o)),
        };
    }

    private formatOrderForErp(order: Order) {
        let deliveryAddress: object;
        try {
            deliveryAddress = JSON.parse(order.deliveryAddress);
        } catch {
            deliveryAddress = { raw: order.deliveryAddress };
        }

        return {
            order_no: order.orderNumber,
            store_id: order.storeId,
            customer_name: order.customerName,
            customer_phone: order.customerPhone,
            delivery_address: deliveryAddress,
            subtotal: order.subtotal,
            discount: order.discount,
            total_amount: order.totalAmount,
            created_at: order.createdAt,
            items: order.items.map((i) => ({
                product_code: i.productCode,
                product_name: i.productName,
                product_price: i.productPrice,
                product_discount_price: i.productDiscountPrice,
                packaging_of_medicines: i.packagingOfMedicines || null,
                product_composition: i.productComposition || null,
                product_type: i.productType || null,
                product_company: i.productCompany || null,
                hsn_code: i.hsnCode || null,
                qty: i.qty,
                total: i.total,
            })),
        };
    }
}
