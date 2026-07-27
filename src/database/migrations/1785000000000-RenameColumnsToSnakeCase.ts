import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameColumnsToSnakeCase1785000000000
  implements MigrationInterface
{
  name = 'RenameColumnsToSnakeCase1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`products\`
      CHANGE \`productName\` \`product_name\` varchar(255) NOT NULL,
      CHANGE \`productCode\` \`product_code\` varchar(255) NOT NULL,
      CHANGE \`productCompany\` \`product_company\` varchar(255) NOT NULL,
      CHANGE \`hsnCode\` \`hsn_code\` varchar(255) NOT NULL,
      CHANGE \`prescriptionRequired\` \`prescription_required\` tinyint NOT NULL DEFAULT 0,
      CHANGE \`productPrice\` \`product_price\` decimal(10,2) NOT NULL,
      CHANGE \`productDiscountPrice\` \`product_discount_price\` decimal(10,2) NOT NULL,
      CHANGE \`productType\` \`product_type\` varchar(255) NOT NULL,
      CHANGE \`packagingOfMedicines\` \`packaging_of_medicines\` varchar(255) NOT NULL,
      CHANGE \`productComposition\` \`product_composition\` varchar(255) NOT NULL,
      CHANGE \`productStock\` \`product_stock\` decimal(10,2) NOT NULL DEFAULT 0,
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updatedAt\` \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      CHANGE \`orderNumber\` \`order_number\` varchar(255) NOT NULL,
      CHANGE \`userId\` \`user_id\` varchar(255) NOT NULL,
      CHANGE \`idempotencyKey\` \`idempotency_key\` varchar(255) NOT NULL,
      CHANGE \`deliveryCharge\` \`delivery_charge\` decimal(10,2) NOT NULL DEFAULT 0,
      CHANGE \`totalAmount\` \`total_amount\` decimal(10,2) NOT NULL,
      CHANGE \`prescriptionUrls\` \`prescription_urls\` text NOT NULL,
      CHANGE \`erpFetchedAt\` \`erp_fetched_at\` datetime NULL,
      CHANGE \`invoiceUrl\` \`invoice_url\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`invoiceNumber\` \`invoice_number\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`cancelledAt\` \`cancelled_at\` datetime NULL,
      CHANGE \`cancellationReason\` \`cancellation_reason\` text NOT NULL,
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      CHANGE \`productCode\` \`product_code\` varchar(255) NOT NULL,
      CHANGE \`productName\` \`product_name\` varchar(255) NOT NULL,
      CHANGE \`productCompany\` \`product_company\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`productType\` \`product_type\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`packagingOfMedicines\` \`packaging_of_medicines\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`productComposition\` \`product_composition\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`productPrice\` \`product_price\` decimal(10,2) NOT NULL,
      CHANGE \`productDiscountPrice\` \`product_discount_price\` decimal(10,2) NOT NULL,
      CHANGE \`hsnCode\` \`hsn_code\` varchar(255) NOT NULL DEFAULT ''
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_status_logs\`
      CHANGE \`fromStatus\` \`from_status\` varchar(255) NULL,
      CHANGE \`toStatus\` \`to_status\` varchar(255) NOT NULL,
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_delivery_addresses\`
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`invoices\`
      CHANGE \`invoiceNo\` \`invoice_no\` varchar(255) NOT NULL,
      CHANGE \`invoiceDate\` \`invoice_date\` varchar(255) NOT NULL,
      CHANGE \`orderNo\` \`order_no\` varchar(255) NOT NULL,
      CHANGE \`grandTotal\` \`grand_total\` varchar(255) NOT NULL,
      CHANGE \`shippingCharge\` \`shipping_charge\` varchar(255) NOT NULL DEFAULT '0.00',
      CHANGE \`walletPrice\` \`wallet_price\` varchar(255) NOT NULL DEFAULT '0.00',
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updatedAt\` \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`invoice_items\`
      CHANGE \`productCode\` \`product_code\` varchar(255) NOT NULL,
      CHANGE \`productName\` \`product_name\` varchar(255) NOT NULL,
      CHANGE \`productPrice\` \`product_price\` varchar(255) NOT NULL,
      CHANGE \`productDiscountPrice\` \`product_discount_price\` varchar(255) NOT NULL,
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`cart_items\`
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`carts\`
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updatedAt\` \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`addresses\`
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updatedAt\` \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`users\`
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`admins\`
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updatedAt\` \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`admins\`
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updated_at\` \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`users\`
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`addresses\`
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updated_at\` \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`carts\`
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updated_at\` \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`cart_items\`
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`invoice_items\`
      CHANGE \`product_code\` \`productCode\` varchar(255) NOT NULL,
      CHANGE \`product_name\` \`productName\` varchar(255) NOT NULL,
      CHANGE \`product_price\` \`productPrice\` varchar(255) NOT NULL,
      CHANGE \`product_discount_price\` \`productDiscountPrice\` varchar(255) NOT NULL,
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`invoices\`
      CHANGE \`invoice_no\` \`invoiceNo\` varchar(255) NOT NULL,
      CHANGE \`invoice_date\` \`invoiceDate\` varchar(255) NOT NULL,
      CHANGE \`order_no\` \`orderNo\` varchar(255) NOT NULL,
      CHANGE \`grand_total\` \`grandTotal\` varchar(255) NOT NULL,
      CHANGE \`shipping_charge\` \`shippingCharge\` varchar(255) NOT NULL DEFAULT '0.00',
      CHANGE \`wallet_price\` \`walletPrice\` varchar(255) NOT NULL DEFAULT '0.00',
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updated_at\` \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_delivery_addresses\`
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_status_logs\`
      CHANGE \`from_status\` \`fromStatus\` varchar(255) NULL,
      CHANGE \`to_status\` \`toStatus\` varchar(255) NOT NULL,
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      CHANGE \`product_code\` \`productCode\` varchar(255) NOT NULL,
      CHANGE \`product_name\` \`productName\` varchar(255) NOT NULL,
      CHANGE \`product_company\` \`productCompany\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`product_type\` \`productType\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`packaging_of_medicines\` \`packagingOfMedicines\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`product_composition\` \`productComposition\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`product_price\` \`productPrice\` decimal(10,2) NOT NULL,
      CHANGE \`product_discount_price\` \`productDiscountPrice\` decimal(10,2) NOT NULL,
      CHANGE \`hsn_code\` \`hsnCode\` varchar(255) NOT NULL DEFAULT ''
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      CHANGE \`order_number\` \`orderNumber\` varchar(255) NOT NULL,
      CHANGE \`user_id\` \`userId\` varchar(255) NOT NULL,
      CHANGE \`idempotency_key\` \`idempotencyKey\` varchar(255) NOT NULL,
      CHANGE \`delivery_charge\` \`deliveryCharge\` decimal(10,2) NOT NULL DEFAULT 0,
      CHANGE \`total_amount\` \`totalAmount\` decimal(10,2) NOT NULL,
      CHANGE \`prescription_urls\` \`prescriptionUrls\` text NOT NULL,
      CHANGE \`erp_fetched_at\` \`erpFetchedAt\` datetime NULL,
      CHANGE \`invoice_url\` \`invoiceUrl\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`invoice_number\` \`invoiceNumber\` varchar(255) NOT NULL DEFAULT '',
      CHANGE \`cancelled_at\` \`cancelledAt\` datetime NULL,
      CHANGE \`cancellation_reason\` \`cancellationReason\` text NOT NULL,
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`products\`
      CHANGE \`product_name\` \`productName\` varchar(255) NOT NULL,
      CHANGE \`product_code\` \`productCode\` varchar(255) NOT NULL,
      CHANGE \`product_company\` \`productCompany\` varchar(255) NOT NULL,
      CHANGE \`hsn_code\` \`hsnCode\` varchar(255) NOT NULL,
      CHANGE \`prescription_required\` \`prescriptionRequired\` tinyint NOT NULL DEFAULT 0,
      CHANGE \`product_price\` \`productPrice\` decimal(10,2) NOT NULL,
      CHANGE \`product_discount_price\` \`productDiscountPrice\` decimal(10,2) NOT NULL,
      CHANGE \`product_type\` \`productType\` varchar(255) NOT NULL,
      CHANGE \`packaging_of_medicines\` \`packagingOfMedicines\` varchar(255) NOT NULL,
      CHANGE \`product_composition\` \`productComposition\` varchar(255) NOT NULL,
      CHANGE \`product_stock\` \`productStock\` decimal(10,2) NOT NULL DEFAULT 0,
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updated_at\` \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);
  }
}
