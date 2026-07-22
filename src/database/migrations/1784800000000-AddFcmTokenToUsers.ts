import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFcmTokenToUsers1784800000000 implements MigrationInterface {
  name = 'AddFcmTokenToUsers1784800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
      ADD \`fcm_token\` varchar(255) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\` DROP COLUMN \`fcm_token\`
    `);
  }
}
