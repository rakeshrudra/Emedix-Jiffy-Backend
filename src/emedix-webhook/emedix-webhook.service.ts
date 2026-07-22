import { Injectable, Logger } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { ProductDto } from '../products/dto/product.dto';
import { ProductStockDto } from '../products/dto/product-stock.dto';
import { Order } from '../orders/entities/order.entity';
import { OrdersService } from '../orders/orders.service';
import { InvoicesService } from '../invoices/invoices.service';
import { InvoiceDto } from '../invoices/dto/invoice.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EmedixWebhookService {
    private readonly logger = new Logger(EmedixWebhookService.name);

    constructor(
        private readonly invoicesService: InvoicesService,
        private readonly productsService: ProductsService,
        private readonly ordersService: OrdersService,
        private readonly usersService: UsersService,
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
        const usersById = new Map<string, User>();
        for (const order of orders) {
            if (usersById.has(order.userId)) continue;
            const user = await this.usersService.findById(order.userId);
            if (user) usersById.set(order.userId, user);
        }

        return {
            count: orders.length,
            orders: orders.map((o) =>
                this.formatOrderForErp(o, usersById.get(o.userId)),
            ),
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
    private formatOrderForErp(order: Order, user?: User) {
        const address = order.deliveryAddress;

        return {
            order_no: order.orderNumber,
            store_id: order.storeId,
            customer_name: user?.name ?? '',
            customer_phone: user?.mobile_no ?? '',
            delivery_address: address
                ? {
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
                  }
                : null,
            subtotal: order.subtotal,
            discount: order.discount,
            total_amount: order.totalAmount,
            scheduled_date: order.scheduledDate,
            scedule_starttime: order.sceduleStarttime,
            schedule_endtime: order.scheduleEndtime,
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
