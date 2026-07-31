import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingForeignKeys1785500000000 implements MigrationInterface {
  name = 'AddMissingForeignKeys1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD CONSTRAINT \`FK_orders_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD CONSTRAINT \`FK_orders_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`store_id\`) ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`carts\`
      ADD CONSTRAINT \`FK_carts_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`carts\`
      ADD CONSTRAINT \`FK_carts_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`store_id\`) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`products\`
      ADD CONSTRAINT \`FK_products_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`store_id\`) ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`cart_items\` DROP FOREIGN KEY \`FK_edd714311619a5ad09525045838\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`cart_items\`
      CHANGE \`cartId\` \`cart_id\` varchar(36) NULL AFTER \`id\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`cart_items\`
      ADD CONSTRAINT \`FK_cart_items_cart\` FOREIGN KEY (\`cart_id\`) REFERENCES \`carts\` (\`id\`) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE \`admins\`
      ADD CONSTRAINT \`FK_admins_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`store_id\`) ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_order_items_order\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      CHANGE \`orderId\` \`order_id\` int NOT NULL AFTER \`id\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      ADD CONSTRAINT \`FK_order_items_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_order_items_order\``);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      CHANGE \`order_id\` \`orderId\` int NOT NULL AFTER \`id\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      ADD CONSTRAINT \`FK_order_items_order\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
    `);

    await queryRunner.query(`ALTER TABLE \`admins\` DROP FOREIGN KEY \`FK_admins_store\``);

    await queryRunner.query(`ALTER TABLE \`cart_items\` DROP FOREIGN KEY \`FK_cart_items_cart\``);

    await queryRunner.query(`
      ALTER TABLE \`cart_items\`
      CHANGE \`cart_id\` \`cartId\` varchar(36) NULL AFTER \`created_at\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`cart_items\`
      ADD CONSTRAINT \`FK_edd714311619a5ad09525045838\` FOREIGN KEY (\`cartId\`) REFERENCES \`carts\` (\`id\`) ON DELETE CASCADE
    `);

    await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_products_store\``);
    await queryRunner.query(`ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_carts_store\``);
    await queryRunner.query(`ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_carts_user\``);
    await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_store\``);
    await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_user\``);
  }
}
