import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * product_stock becomes a whole-unit integer. Existing fractional values are
 * floored (6.8 -> 6, 2.4 -> 2) to match the inventory upload parser, which
 * now applies Math.floor to the "Current Stock" column.
 */
export class MakeProductStockInteger1788000000000 implements MigrationInterface {
  name = 'MakeProductStockInteger1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE \`products\` SET \`product_stock\` = FLOOR(\`product_stock\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` CHANGE \`product_stock\` \`product_stock\` int NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`products\` CHANGE \`product_stock\` \`product_stock\` decimal(10,2) NOT NULL DEFAULT 0`,
    );
  }
}
