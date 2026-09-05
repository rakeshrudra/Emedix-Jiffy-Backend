import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * stores.store_id is varchar(20), but every column referencing it as a
 * foreign key was left at TypeORM's default varchar(255) (no explicit
 * length was declared on the @Column). Aligns all of them to varchar(20)
 * to match the referenced primary key exactly.
 */
export class AlignStoreIdForeignKeyLength1788300000000
  implements MigrationInterface
{
  name = 'AlignStoreIdForeignKeyLength1788300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tables with a real FK constraint — drop, resize, re-add.
    await queryRunner.query(
      `ALTER TABLE \`admins\` DROP FOREIGN KEY \`FK_admins_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`admins\` MODIFY COLUMN \`store_id\` varchar(20) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`admins\` ADD CONSTRAINT \`FK_admins_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_carts_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` ADD CONSTRAINT \`FK_carts_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_orders_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_products_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD CONSTRAINT \`FK_products_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );

    // No FK constraint declared — plain resize.
    await queryRunner.query(
      `ALTER TABLE \`products_swil\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoices\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`invoices\` MODIFY COLUMN \`store_id\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products_swil\` MODIFY COLUMN \`store_id\` varchar(255) NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_products_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` MODIFY COLUMN \`store_id\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD CONSTRAINT \`FK_products_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` MODIFY COLUMN \`store_id\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_orders_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );

    await queryRunner.query(
      `ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_carts_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` MODIFY COLUMN \`store_id\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` ADD CONSTRAINT \`FK_carts_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE \`admins\` DROP FOREIGN KEY \`FK_admins_store\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`admins\` MODIFY COLUMN \`store_id\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`admins\` ADD CONSTRAINT \`FK_admins_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT`,
    );
  }
}
