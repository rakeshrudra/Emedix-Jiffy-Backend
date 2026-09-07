import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTermsAcceptedToStores1788100000000 implements MigrationInterface {
  name = 'AddTermsAcceptedToStores1788100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`stores\` ADD \`terms_accepted\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`stores\` DROP COLUMN \`terms_accepted\``);
  }
}
