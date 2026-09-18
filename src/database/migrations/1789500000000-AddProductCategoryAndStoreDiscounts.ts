import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCategoryAndStoreDiscounts1789500000000
  implements MigrationInterface
{
  name = 'AddProductCategoryAndStoreDiscounts1789500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD COLUMN \`products_category\` enum ('Medicine', 'Non Medicine') NOT NULL DEFAULT 'Medicine'`,
    );

    await queryRunner.query(
      `ALTER TABLE \`stores\` ADD COLUMN \`medicine_discount_percent\` decimal(5,2) NOT NULL DEFAULT '0.00'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stores\` ADD COLUMN \`non_medicine_discount_percent\` decimal(5,2) NOT NULL DEFAULT '0.00'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`stores\` DROP COLUMN \`non_medicine_discount_percent\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stores\` DROP COLUMN \`medicine_discount_percent\``,
    );

    await queryRunner.query(
      `ALTER TABLE \`products\` DROP COLUMN \`products_category\``,
    );
  }
}
