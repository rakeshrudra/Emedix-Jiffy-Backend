import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameProductsSwilColumns1785100000000
  implements MigrationInterface
{
  name = 'RenameProductsSwilColumns1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`products_swil\`
      CHANGE \`productName\` \`product_name\` varchar(255) NOT NULL,
      CHANGE \`productCode\` \`product_code\` varchar(255) NOT NULL,
      CHANGE \`productCompany\` \`product_company\` varchar(255) NOT NULL,
      CHANGE \`prescriptionRequired\` \`prescription_required\` varchar(255) NOT NULL,
      CHANGE \`productPrice\` \`product_price\` varchar(255) NOT NULL,
      CHANGE \`productDiscountPrice\` \`product_discount_price\` varchar(255) NOT NULL,
      CHANGE \`productType\` \`product_type\` varchar(255) NOT NULL,
      CHANGE \`packagingOfMedicines\` \`packaging_of_medicines\` varchar(255) NOT NULL,
      CHANGE \`productComposition\` \`product_composition\` text NOT NULL,
      CHANGE \`productStock\` \`product_stock\` varchar(255) NOT NULL,
      CHANGE \`lastUpdated\` \`last_updated\` varchar(255) NOT NULL,
      CHANGE \`createdAt\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updatedAt\` \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      CHANGE \`hsnCode\` \`hsn_code\` varchar(255) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`products_swil\`
      CHANGE \`product_name\` \`productName\` varchar(255) NOT NULL,
      CHANGE \`product_code\` \`productCode\` varchar(255) NOT NULL,
      CHANGE \`product_company\` \`productCompany\` varchar(255) NOT NULL,
      CHANGE \`prescription_required\` \`prescriptionRequired\` varchar(255) NOT NULL,
      CHANGE \`product_price\` \`productPrice\` varchar(255) NOT NULL,
      CHANGE \`product_discount_price\` \`productDiscountPrice\` varchar(255) NOT NULL,
      CHANGE \`product_type\` \`productType\` varchar(255) NOT NULL,
      CHANGE \`packaging_of_medicines\` \`packagingOfMedicines\` varchar(255) NOT NULL,
      CHANGE \`product_composition\` \`productComposition\` text NOT NULL,
      CHANGE \`product_stock\` \`productStock\` varchar(255) NOT NULL,
      CHANGE \`last_updated\` \`lastUpdated\` varchar(255) NOT NULL,
      CHANGE \`created_at\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      CHANGE \`updated_at\` \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      CHANGE \`hsn_code\` \`hsnCode\` varchar(255) NOT NULL
    `);
  }
}
