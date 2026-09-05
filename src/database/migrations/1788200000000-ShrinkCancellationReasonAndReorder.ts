import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * cancellation_reason as TEXT was wasteful for a short free-text reason —
 * shrunk to varchar(500). Also moves cancelled_by (previously the very last
 * column) to sit right before cancelled_at, matching entity declaration order.
 */
export class ShrinkCancellationReasonAndReorder1788200000000
  implements MigrationInterface
{
  name = 'ShrinkCancellationReasonAndReorder1788200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`orders\` CHANGE \`cancellation_reason\` \`cancellation_reason\` varchar(500) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` MODIFY COLUMN \`cancelled_by\` enum('USER','STORE') NULL AFTER \`invoice_number\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`orders\` MODIFY COLUMN \`cancelled_by\` enum('USER','STORE') NULL AFTER \`created_at\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` CHANGE \`cancellation_reason\` \`cancellation_reason\` text NULL`,
    );
  }
}
