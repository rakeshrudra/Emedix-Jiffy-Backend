import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppVersionsUpdatedAt1789400000000
  implements MigrationInterface
{
  name = 'AddAppVersionsUpdatedAt1789400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`app_versions\` ADD COLUMN \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`app_versions\` DROP COLUMN \`updated_at\``,
    );
  }
}
