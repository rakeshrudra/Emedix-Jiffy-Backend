import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMobileNoAndIdentityIdToAdmins1786533942365
  implements MigrationInterface
{
  name = 'AddMobileNoAndIdentityIdToAdmins1786533942365';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`admins\` MODIFY COLUMN \`identity_id\` varchar(36) NOT NULL AFTER \`id\``);
    await queryRunner.query(`ALTER TABLE \`admins\` MODIFY COLUMN \`mobile_no\` varchar(10) NOT NULL AFTER \`identity_id\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`admins\` DROP INDEX \`IDX_admins_identity_id\``);
    await queryRunner.query(`ALTER TABLE \`admins\` DROP COLUMN \`identity_id\``);
    await queryRunner.query(`ALTER TABLE \`admins\` DROP INDEX \`IDX_admins_mobile_no\``);
    await queryRunner.query(`ALTER TABLE \`admins\` DROP COLUMN \`mobile_no\``);
    await queryRunner.query(`ALTER TABLE \`admins\` ADD \`password_hash\` varchar(255) NOT NULL`);
  }
}
