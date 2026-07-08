import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderDeliveryAddresses1783498694590 implements MigrationInterface {
  name = 'AddOrderDeliveryAddresses1783498694590';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`order_delivery_addresses\` (
        \`id\` varchar(36) NOT NULL,
        \`order_id\` varchar(36) NOT NULL,
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
        UNIQUE INDEX \`REL_order_delivery_addresses_order_id\` (\`order_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_delivery_addresses\`
      ADD CONSTRAINT \`FK_order_delivery_addresses_order_id\`
      FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE
    `);

    await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`deliveryAddress\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`orders\` ADD \`deliveryAddress\` text NOT NULL DEFAULT ('')`);
    await queryRunner.query(`ALTER TABLE \`orders\` ALTER \`deliveryAddress\` DROP DEFAULT`);

    await queryRunner.query(
      `ALTER TABLE \`order_delivery_addresses\` DROP FOREIGN KEY \`FK_order_delivery_addresses_order_id\``,
    );
    await queryRunner.query(`DROP TABLE \`order_delivery_addresses\``);
  }
}
