import { Injectable, Logger } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { ProductDto } from '../products/dto/product.dto';
import { ProductStockDto } from '../products/dto/product-stock.dto';
import { Order } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';
import { InvoicesService } from '../invoices/invoices.service';
import { InvoiceDto } from '../invoices/dto/invoice.dto';

@Injectable()
export class EmedixWebhookService {
    private readonly logger = new Logger(EmedixWebhookService.name);

    constructor(
        private readonly invoicesService: InvoicesService,
        private readonly productsService: ProductsService,
        private readonly ordersService: OrdersService,
    ) { }

    // ── Product Add / Update ──
    async handleProduct(data: ProductDto | ProductDto[]): Promise<{ received: number; message: string }> {
        const items = Array.isArray(data) ? data : [data];

        try {
            await this.productsService.upsertFromErp(items);
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
            await this.productsService.updateStockFromErp(items);
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

    // ── Pending Orders ──
    async handlePendingOrders(storeId: string) {
        const orders = await this.ordersService.fetchPendingOrders(storeId);
        return {
            count: orders.length,
            orders: orders.map((o) => this.formatOrderForErp(o)),
        };
    }

    // ── Invoice Upload ──
    async handleInvoice(invoices: InvoiceDto[]): Promise<{ message: string }> {
        await this.invoicesService.upsertFromErp(invoices);

        for (const inv of invoices) {
            if (!inv.order_no) continue;

            try {
                await this.ordersService.applyErpStatusUpdate(
                    inv.order_no,
                    'CONFIRMED',
                    undefined,
                    undefined,
                    inv.invoice_no,
                );
                this.logger.log(`Order ${inv.order_no} -> CONFIRMED via invoice ${inv.invoice_no}`);
            } catch (err: unknown) {
                this.logger.warn(
                    `Invoice ${inv.invoice_no}: could not update order ${inv.order_no}: ${(err as Error).message}`,
                );
            }
        }

        this.logger.log(`Upserted ${invoices.length} invoice(s)`);
        return {
            message: `Successfully processed invoices`,
        };
    }

    // ─── Private helpers ────────────────────────────────────────────────────────
    private formatOrderForErp(order: Order) {
        const address = order.deliveryAddress;

        return {
            order_no: order.orderNumber,
            store_id: order.storeId,
            customer_name: order.customerName,
            customer_phone: order.customerPhone,
            delivery_address: {
                label: address.label,
                address_line_1: address.addressLine1,
                address_line_2: address.addressLine2,
                formatted_address: address.formattedAddress,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country,
                latitude: address.latitude,
                longitude: address.longitude,
            },
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
