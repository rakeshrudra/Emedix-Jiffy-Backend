import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderDeliveries1784100000000 implements MigrationInterface {
  name = 'CreateOrderDeliveries1784100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`order_deliveries\` (` +
        `\`id\` varchar(36) NOT NULL, ` +
        `\`order_id\` varchar(36) NOT NULL, ` +
        `\`delivery_partner_name\` varchar(255) NOT NULL, ` +
        `\`delivery_partner_phone\` varchar(255) NOT NULL, ` +
        `\`estimated_delivery_time\` datetime NULL, ` +
        `\`dispatched_at\` datetime NOT NULL, ` +
        `\`delivered_at\` datetime NULL, ` +
        `\`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), ` +
        `\`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), ` +
        `UNIQUE INDEX \`UQ_order_deliveries_order_id\` (\`order_id\`), ` +
        `PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_deliveries\` ADD CONSTRAINT \`FK_order_deliveries_order_id\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`order_deliveries\` DROP FOREIGN KEY \`FK_order_deliveries_order_id\``,
    );
    await queryRunner.query(
      `DROP INDEX \`UQ_order_deliveries_order_id\` ON \`order_deliveries\``,
    );
    await queryRunner.query(`DROP TABLE \`order_deliveries\``);
  }
}
