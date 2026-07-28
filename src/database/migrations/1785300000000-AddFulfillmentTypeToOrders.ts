import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFulfillmentTypeToOrders1785300000000
  implements MigrationInterface
{
  name = 'AddFulfillmentTypeToOrders1785300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD \`fulfillment_type\` enum('PICKUP','DELIVERY') NOT NULL DEFAULT 'PICKUP'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      DROP COLUMN \`fulfillment_type\`
    `);
  }
}
