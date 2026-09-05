import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reverts two earlier sizing changes per request:
 * - stores.store_id (and its 6 referencing columns) back to varchar(20).
 * - orders.cancellation_reason back to TEXT (still nullable).
 */
export class RevertStoreIdAndCancellationReasonSizing1788600000000
  implements MigrationInterface
{
  name = 'RevertStoreIdAndCancellationReasonSizing1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`admins\` DROP FOREIGN KEY \`FK_admins_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_carts_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_products_store\``,
    );

    await queryRunner.query(
      `ALTER TABLE \`stores\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE \`admins\` MODIFY COLUMN \`store_id\` varchar(20) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`admins\` ADD CONSTRAINT \`FK_admins_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`carts\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` ADD CONSTRAINT \`FK_carts_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE \`orders\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_orders_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`products\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD CONSTRAINT \`FK_products_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`products_swil\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoices\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE \`orders\` CHANGE \`cancellation_reason\` \`cancellation_reason\` text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`orders\` CHANGE \`cancellation_reason\` \`cancellation_reason\` varchar(500) NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE \`admins\` DROP FOREIGN KEY \`FK_admins_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_carts_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_products_store\``,
    );

    await queryRunner.query(
      `ALTER TABLE \`stores\` MODIFY COLUMN \`store_id\` varchar(10) NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE \`admins\` MODIFY COLUMN \`store_id\` varchar(10) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`admins\` ADD CONSTRAINT \`FK_admins_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`carts\` MODIFY COLUMN \`store_id\` varchar(10) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` ADD CONSTRAINT \`FK_carts_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE \`orders\` MODIFY COLUMN \`store_id\` varchar(10) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_orders_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`products\` MODIFY COLUMN \`store_id\` varchar(10) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD CONSTRAINT \`FK_products_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`products_swil\` MODIFY COLUMN \`store_id\` varchar(10) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoices\` MODIFY COLUMN \`store_id\` varchar(10) NOT NULL`,
    );
  }
}
