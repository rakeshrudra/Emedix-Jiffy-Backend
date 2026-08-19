import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAdminUpdatedAt1787060352785 implements MigrationInterface {
  name = 'DropAdminUpdatedAt1787060352785';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`admins\` DROP COLUMN \`updated_at\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`admins\` ADD COLUMN \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
  }
}
