import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
    constructor(
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
        @InjectRepository(InvoiceItem)
        private readonly invoiceItemRepository: Repository<InvoiceItem>,
    ) { }

    /**
     * Looked up by orderNo — used by OrdersService for the user-facing
     * GET /orders/:id/invoice endpoint.
     */
    async findByOrderNumber(orderNo: string): Promise<Invoice | null> {
        return this.invoiceRepository.findOne({
            where: { orderNo },
            relations: ['items'],
        });
    }

    /**
     * Upserts invoices + their line items from an ERP webhook payload.
     * Keyed by (storeId, invoiceNo) for the invoice, (invoice, productCode) for items.
     */
    async upsertFromErp(invoices: InvoiceDto[]): Promise<void> {
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
        }
    }
}
