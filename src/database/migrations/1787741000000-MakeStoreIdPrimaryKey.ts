import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeStoreIdPrimaryKey1787741000000 implements MigrationInterface {
  name = 'MakeStoreIdPrimaryKey1787741000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`admins\` DROP FOREIGN KEY \`FK_admins_store\``);
    await queryRunner.query(`ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_carts_store\``);
    await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_store\``);
    await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_products_store\``);

    await queryRunner.query(`ALTER TABLE \`stores\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`stores\` DROP INDEX \`IDX_stores_store_id\`, MODIFY COLUMN \`store_id\` varchar(20) NOT NULL, ADD PRIMARY KEY (\`store_id\`)`);
    await queryRunner.query(`ALTER TABLE \`stores\` DROP COLUMN \`id\``);

    await queryRunner.query(`ALTER TABLE \`admins\` ADD CONSTRAINT \`FK_admins_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`carts\` ADD CONSTRAINT \`FK_carts_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_orders_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_products_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`admins\` DROP FOREIGN KEY \`FK_admins_store\``);
    await queryRunner.query(`ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_carts_store\``);
    await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_store\``);
    await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_products_store\``);

    await queryRunner.query(`ALTER TABLE \`stores\` ADD \`id\` varchar(36) NOT NULL`);
    await queryRunner.query(`UPDATE \`stores\` SET \`id\` = (SELECT UUID())`);
    await queryRunner.query(`ALTER TABLE \`stores\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`stores\` MODIFY COLUMN \`store_id\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`stores\` ADD PRIMARY KEY (\`id\`)`);
    await queryRunner.query(`ALTER TABLE \`stores\` ADD UNIQUE INDEX \`IDX_stores_store_id\` (\`store_id\`)`);

    await queryRunner.query(`ALTER TABLE \`admins\` ADD CONSTRAINT \`FK_admins_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`carts\` ADD CONSTRAINT \`FK_carts_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_orders_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_products_store\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`store_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
  }
}
