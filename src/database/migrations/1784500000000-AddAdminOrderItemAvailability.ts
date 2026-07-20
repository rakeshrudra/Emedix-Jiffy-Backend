import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminOrderItemAvailability1784500000000 implements MigrationInterface {
  name = 'AddAdminOrderItemAvailability1784500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      ADD \`is_available\` tinyint NOT NULL DEFAULT 0,
      ADD \`confirmed_quantity\` int NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      CHANGE \`status\` \`status\`
      enum('PENDING','CONFIRMED','READY_FOR_PICKUP','PICKED_UP','DELIVERED','CANCELLED','FAILED')
      NOT NULL DEFAULT 'PENDING'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      CHANGE \`status\` \`status\`
      enum('PENDING','CONFIRMED','READY_FOR_PICKUP','DELIVERED','CANCELLED','FAILED')
      NOT NULL DEFAULT 'PENDING'
    `);

    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      DROP COLUMN \`confirmed_quantity\`,
      DROP COLUMN \`is_available\`
    `);
  }
}
