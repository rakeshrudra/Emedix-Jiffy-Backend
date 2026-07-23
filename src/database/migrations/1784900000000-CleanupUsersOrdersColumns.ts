import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupUsersOrdersColumns1784900000000
  implements MigrationInterface
{
  name = 'CleanupUsersOrdersColumns1784900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`updatedAt\``);
    await queryRunner.query(`
      ALTER TABLE \`users\`
      MODIFY \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) AFTER \`fcm_token\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      MODIFY \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) AFTER \`schedule_endtime\`
    `);

    await queryRunner.query(`ALTER TABLE \`order_items\` DROP COLUMN \`createdAt\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`order_items\`
      ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      MODIFY \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) AFTER \`cancellationReason\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`users\`
      MODIFY \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);
    await queryRunner.query(`
      ALTER TABLE \`users\`
      ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);
  }
}
