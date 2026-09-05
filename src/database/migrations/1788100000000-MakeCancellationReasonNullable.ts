import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * cancellation_reason was TEXT NOT NULL with no DB default, which broke
 * createOrder inserts since MySQL cannot give a TEXT column a DEFAULT.
 * It's only ever set when an order is actually cancelled, so NULL is the
 * correct "not cancelled yet" representation (same as cancelled_at).
 */
export class MakeCancellationReasonNullable1788100000000
  implements MigrationInterface
{
  name = 'MakeCancellationReasonNullable1788100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`orders\` CHANGE \`cancellation_reason\` \`cancellation_reason\` text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE \`orders\` SET \`cancellation_reason\` = '' WHERE \`cancellation_reason\` IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` CHANGE \`cancellation_reason\` \`cancellation_reason\` text NOT NULL`,
    );
  }
}
