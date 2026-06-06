import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoiceDto } from './dto/invoice.dto';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class InvoicesService {
    private readonly logger = new Logger(InvoicesService.name);

    constructor(
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
        @InjectRepository(InvoiceItem)
        private readonly invoiceItemRepository: Repository<InvoiceItem>,
        private readonly ordersService: OrdersService,
    ) {}

    async handleInvoice(invoices: InvoiceDto[]): Promise<{ received: number; message: string }> {
        for (const inv of invoices) {
            let invoice = await this.invoiceRepository.findOne({
                where: { storeId: inv.store_id, invoiceNo: inv.invoice_no },
            });

            const invoiceFields = {
                storeId: inv.store_id,
                invoiceDate: inv.invoice_date,
                orderNo: inv.order_no,
                tax: inv.tax,
                subtotal: inv.subtotal,
                grandTotal: inv.grand_total,
                shippingCharge: inv.shipping_charge ?? '0.00',
                walletPrice: inv.wallet_price ?? '0.00',
            };

            if (invoice) {
                Object.assign(invoice, invoiceFields);
            } else {
                invoice = this.invoiceRepository.create({
                    invoiceNo: inv.invoice_no,
                    ...invoiceFields,
                });
            }

            const savedInvoice = await this.invoiceRepository.save(invoice);

            if (inv.items && inv.items.length > 0) {
                for (const item of inv.items) {
                    const existingItem = await this.invoiceItemRepository.findOne({
                        where: { invoice: { id: savedInvoice.id }, productCode: item.product_code },
                    });

                    const itemData = {
                        productName: item.product_name,
                        productPrice: item.product_price,
                        productDiscountPrice: item.product_discount_price,
                        qty: item.qty,
                        total: item.total,
                    };

                    if (existingItem) {
                        Object.assign(existingItem, itemData);
                        await this.invoiceItemRepository.save(existingItem);
                    } else {
                        await this.invoiceItemRepository.save(
                            this.invoiceItemRepository.create({
                                invoice: savedInvoice,
                                productCode: item.product_code,
                                ...itemData,
                            }),
                        );
                    }
                }
            }

            if (inv.order_no) {
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
        }

        this.logger.log(`Upserted ${invoices.length} invoice(s)`);
        return {
            received: invoices.length,
            message: `Successfully processed ${invoices.length} invoice(s)`,
        };
    }
}
