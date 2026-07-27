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
     * Looked up by order_no — used by OrdersService for the user-facing
     * GET /orders/:id/invoice endpoint.
     */
    async findByOrderNumber(orderNo: string): Promise<Invoice | null> {
        return this.invoiceRepository.findOne({
            where: { order_no: orderNo },
            relations: ['items'],
        });
    }

    /**
     * Upserts invoices + their line items from an ERP webhook payload.
     * Keyed by (store_id, invoice_no) for the invoice, (invoice, product_code) for items.
     */
    async upsertFromErp(invoices: InvoiceDto[]): Promise<void> {
        for (const inv of invoices) {
            let invoice = await this.invoiceRepository.findOne({
                where: { store_id: inv.store_id, invoice_no: inv.invoice_no },
            });

            const invoiceFields = {
                store_id: inv.store_id,
                invoice_date: inv.invoice_date,
                order_no: inv.order_no,
                tax: inv.tax,
                subtotal: inv.subtotal,
                grand_total: inv.grand_total,
                shipping_charge: inv.shipping_charge ?? '0.00',
                wallet_price: inv.wallet_price ?? '0.00',
            };

            if (invoice) {
                Object.assign(invoice, invoiceFields);
            } else {
                invoice = this.invoiceRepository.create({
                    invoice_no: inv.invoice_no,
                    ...invoiceFields,
                });
            }

            const savedInvoice = await this.invoiceRepository.save(invoice);

            if (inv.items && inv.items.length > 0) {
                for (const item of inv.items) {
                    const existingItem = await this.invoiceItemRepository.findOne({
                        where: { invoice: { id: savedInvoice.id }, product_code: item.product_code },
                    });

                    const itemData = {
                        product_name: item.product_name,
                        product_price: item.product_price,
                        product_discount_price: item.product_discount_price,
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
                                product_code: item.product_code,
                                ...itemData,
                            }),
                        );
                    }
                }
            }
        }
    }
}
