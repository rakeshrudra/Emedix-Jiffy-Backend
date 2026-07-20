import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * V1 ERP cutover — splits the old ERP-fed `products` table into:
 *  - `products_swil`: frozen copy of the old table, kept alive only for
 *    /emedix-webhook/* endpoints (unused by the live app going forward).
 *  - `products`: fresh table with the new schema for store-staff CSV import,
 *    used by product browsing, search, cart, and order creation.
 *
 * No data is copied into the new `products` table — store staff import
 * fresh CSV data directly via remote DB access.
 */
export class SplitProductsSwilAndLiveTable1784041291771 implements MigrationInterface {
  name = 'SplitProductsSwilAndLiveTable1784041291771';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Preserve the existing ERP-fed table as products_swil, untouched.
    await queryRunner.query(`RENAME TABLE \`products\` TO \`products_swil\``);

    // 2. Fresh products table per docs/newProductsSchema.md.
    await queryRunner.query(`
      CREATE TABLE \`products\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`store_id\` varchar(255) NOT NULL,
        \`productName\` varchar(255) NOT NULL,
        \`productCode\` varchar(255) NOT NULL,
        \`productCompany\` varchar(255) NOT NULL,
        \`hsnCode\` varchar(255) NOT NULL,
        \`prescriptionRequired\` tinyint NOT NULL DEFAULT 0,
        \`productPrice\` decimal(10,2) NOT NULL,
        \`productDiscountPrice\` decimal(10,2) NOT NULL,
        \`productType\` varchar(255) NOT NULL,
        \`packagingOfMedicines\` varchar(255) NOT NULL,
        \`productComposition\` varchar(255) NOT NULL,
        \`status\` enum('Enable','Disable') NOT NULL DEFAULT 'Enable',
        \`productStock\` decimal(10,2) NOT NULL DEFAULT 0,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_products_store_id_product_code\` (\`store_id\`, \`productCode\`),
        INDEX \`IDX_products_product_name\` (\`productName\`),
        INDEX \`IDX_products_product_company\` (\`productCompany\`),
        INDEX \`IDX_products_product_composition\` (\`productComposition\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drops the fresh products table (its data is not recoverable — it was
    // never derived from products_swil) and restores the original table.
    await queryRunner.query(`DROP TABLE \`products\``);
    await queryRunner.query(`RENAME TABLE \`products_swil\` TO \`products\``);
  }
}
