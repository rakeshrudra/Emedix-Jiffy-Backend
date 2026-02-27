import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { Invoice } from './entities/invoice.entity.js';
import { InvoiceItem } from './entities/invoice-item.entity.js';
import { ProductDto } from './dto/product.dto.js';
import { ProductStockDto } from './dto/product-stock.dto.js';
import { InvoiceDto } from './dto/invoice.dto.js';

@Injectable()
export class EmedixWebhookService {
    private readonly logger = new Logger(EmedixWebhookService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
        @InjectRepository(InvoiceItem)
        private readonly invoiceItemRepository: Repository<InvoiceItem>,
    ) { }

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
                    hsnSac: item['HSN/SAC'],
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

    // ── Invoice Upload ──
    async handleInvoice(invoices: InvoiceDto[]): Promise<{ received: number; message: string }> {
        for (const inv of invoices) {
            // Find or create invoice using composite key
            let invoice = await this.invoiceRepository.findOne({
                where: { storeId: inv.store_id, invoiceNo: inv.invoice_no },
            });

            const invoiceFields = {
                storeId: inv.store_id,
                invoiceDate: inv.invoice_date,
                orderNo: inv.order_no,
                orderStatus: inv.order_status,
                customerName: inv.customername,
                address1: inv.address1,
                customerCity: inv.customercity,
                customerCountry: inv.customercountry,
                customerZipcode: inv.customerzipcode,
                paymentMethod: inv.paymentmethod,
                phoneNo: inv.phone_no,
                paymentType: inv.payment_type,
                couponCode: inv.coupon_code,
                couponDiscount: inv.coupon_discount,
                couponPrice: inv.coupon_price,
                walletPrice: inv.wallet_price,
                shippingCharge: inv.shipping_charge,
                tax: inv.tax,
            };

            if (invoice) {
                Object.assign(invoice, invoiceFields);
            } else {
                invoice = this.invoiceRepository.create({
                    invoiceNo: inv.invoice_no,
                    ...invoiceFields,
                });
            }

            // Save invoice first to get the ID
            const savedInvoice = await this.invoiceRepository.save(invoice);

            // Upsert items individually
            if (inv.items && inv.items.length > 0) {
                for (const item of inv.items) {
                    const existingItem = await this.invoiceItemRepository.findOne({
                        where: { invoice: { id: savedInvoice.id }, itemNo: item.item_no },
                    });

                    const itemData = {
                        qty: item.qty,
                        discountPrice: item.discount_price,
                        price: item.price,
                        itemName: item.item_name,
                        total: item.total,
                        isReturn: item.is_return,
                        returnComment: item.return_comment,
                    };

                    if (existingItem) {
                        Object.assign(existingItem, itemData);
                        await this.invoiceItemRepository.save(existingItem);
                    } else {
                        const newItem = this.invoiceItemRepository.create({
                            invoice: savedInvoice,
                            itemNo: item.item_no,
                            ...itemData,
                        });
                        await this.invoiceItemRepository.save(newItem);
                    }
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
