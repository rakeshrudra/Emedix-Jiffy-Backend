import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Normalizes orders/order_items:
 *  - orders.id: uuid -> int autoincrement (cascades to every FK referencing it)
 *  - orders: drop erpOrderId, paymentMethod, paymentStatus, paymentGatewayRef,
 *    customerName, customerPhone, updatedAt; reorder store_id after orderNumber
 *  - order_items: productComposition text -> varchar, productPrice /
 *    productDiscountPrice / total varchar -> decimal(10,2), matching Product
 *
 * Existing rows in orders/order_items/order_status_logs/order_delivery_addresses/
 * order_deliveries are test data from the ongoing V1 build and are not migrated —
 * all five tables are dropped and recreated.
 */
export class NormalizeOrdersSchema1784300000000 implements MigrationInterface {
  name = 'NormalizeOrdersSchema1784300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop dependent tables first (FK order), then the orders table itself.
    await queryRunner.query('DROP TABLE IF EXISTS `order_deliveries`');
    await queryRunner.query('DROP TABLE IF EXISTS `order_delivery_addresses`');
    await queryRunner.query('DROP TABLE IF EXISTS `order_status_logs`');
    await queryRunner.query('DROP TABLE IF EXISTS `order_items`');
    await queryRunner.query('DROP TABLE IF EXISTS `orders`');

    await queryRunner.query(`
      CREATE TABLE \`orders\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orderNumber\` varchar(255) NOT NULL,
        \`store_id\` varchar(255) NOT NULL,
        \`userId\` varchar(255) NOT NULL,
        \`status\` enum('PENDING','CONFIRMED','READY_FOR_PICKUP','DELIVERED','CANCELLED','FAILED') NOT NULL DEFAULT 'PENDING',
        \`idempotencyKey\` varchar(255) NOT NULL,
        \`subtotal\` decimal(10,2) NOT NULL,
        \`deliveryCharge\` decimal(10,2) NOT NULL DEFAULT 0,
        \`discount\` decimal(10,2) NOT NULL DEFAULT 0,
        \`totalAmount\` decimal(10,2) NOT NULL,
        \`prescriptionUrls\` text NOT NULL,
        \`erpFetchedAt\` datetime NULL,
        \`invoiceUrl\` varchar(255) NOT NULL DEFAULT '',
        \`invoiceNumber\` varchar(255) NOT NULL DEFAULT '',
        \`cancelledAt\` datetime NULL,
        \`cancellationReason\` text NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_orders_order_number\` (\`orderNumber\`),
        UNIQUE INDEX \`IDX_orders_idempotency_key\` (\`idempotencyKey\`),
        INDEX \`IDX_orders_user_id\` (\`userId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`order_items\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orderId\` int NOT NULL,
        \`productCode\` varchar(255) NOT NULL,
        \`productName\` varchar(255) NOT NULL,
        \`productCompany\` varchar(255) NOT NULL DEFAULT '',
        \`productType\` varchar(255) NOT NULL DEFAULT '',
        \`packagingOfMedicines\` varchar(255) NOT NULL DEFAULT '',
        \`productComposition\` varchar(255) NOT NULL DEFAULT '',
        \`qty\` int NOT NULL,
        \`productPrice\` decimal(10,2) NOT NULL,
        \`productDiscountPrice\` decimal(10,2) NOT NULL,
        \`total\` decimal(10,2) NOT NULL,
        \`hsnCode\` varchar(255) NOT NULL DEFAULT '',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_order_items_order\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`order_status_logs\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orderId\` int NOT NULL,
        \`fromStatus\` varchar(255) NULL,
        \`toStatus\` varchar(255) NOT NULL,
        \`actor\` enum('USER','ERP','SYSTEM','ADMIN') NOT NULL,
        \`notes\` text NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_order_status_logs_order_id\` (\`orderId\`),
        CONSTRAINT \`FK_order_status_logs_order\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`order_delivery_addresses\` (
        \`id\` varchar(36) NOT NULL,
        \`order_id\` int NOT NULL,
        \`source_address_id\` varchar(255) NULL,
        \`label\` varchar(255) NOT NULL DEFAULT 'Other',
        \`address_line_1\` varchar(255) NOT NULL DEFAULT '',
        \`address_line_2\` varchar(255) NOT NULL DEFAULT '',
        \`formatted_address\` text NOT NULL,
        \`city\` varchar(255) NOT NULL,
        \`state\` varchar(255) NOT NULL,
        \`pincode\` varchar(255) NOT NULL,
        \`country\` varchar(255) NOT NULL DEFAULT 'India',
        \`latitude\` decimal(10,7) NOT NULL,
        \`longitude\` decimal(10,7) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`REL_order_delivery_addresses_order_id\` (\`order_id\`),
        CONSTRAINT \`FK_order_delivery_addresses_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`order_deliveries\` (
        \`id\` varchar(36) NOT NULL,
        \`order_id\` int NOT NULL,
        \`delivery_partner_name\` varchar(255) NOT NULL,
        \`delivery_partner_phone\` varchar(255) NOT NULL,
        \`estimated_delivery_time\` datetime NULL,
        \`dispatched_at\` datetime NOT NULL,
        \`delivered_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_order_deliveries_order_id\` (\`order_id\`),
        CONSTRAINT \`FK_order_deliveries_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `order_deliveries`');
    await queryRunner.query('DROP TABLE IF EXISTS `order_delivery_addresses`');
    await queryRunner.query('DROP TABLE IF EXISTS `order_status_logs`');
    await queryRunner.query('DROP TABLE IF EXISTS `order_items`');
    await queryRunner.query('DROP TABLE IF EXISTS `orders`');
    // Reverting to the previous (uuid-keyed, payment/customer-field) schema
    // is not supported — restore from backup if needed.
  }
}
