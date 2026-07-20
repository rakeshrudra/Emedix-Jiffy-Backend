import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeStoresSchema1784600000000 implements MigrationInterface {
  name = 'NormalizeStoresSchema1784600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add emedix_name (3rd column, right after store_id).
    await queryRunner.query(`
      ALTER TABLE \`stores\`
      ADD \`emedix_name\` varchar(255) NOT NULL DEFAULT '' AFTER \`store_id\`
    `);
    await queryRunner.query(`
      UPDATE \`stores\` SET \`emedix_name\` = \`name\` WHERE \`emedix_name\` = ''
    `);
    await queryRunner.query(`
      ALTER TABLE \`stores\` CHANGE \`emedix_name\` \`emedix_name\` varchar(255) NOT NULL
    `);

    // Strip known separators from existing phone values and keep the last
    // 10 digits (drops a leading +91 country code where present). MySQL 5.7
    // has no REGEXP_REPLACE, so separators are stripped with nested REPLACE().
    await queryRunner.query(`
      UPDATE \`stores\`
      SET \`phone\` = RIGHT(
        REPLACE(REPLACE(REPLACE(REPLACE(\`phone\`, '+', ''), '-', ''), ' ', ''), '.', ''),
        10
      )
      WHERE \`phone\` IS NOT NULL
    `);
    await queryRunner.query(`
      UPDATE \`stores\`
      SET \`phone\` = NULL
      WHERE \`phone\` IS NOT NULL
        AND (CHAR_LENGTH(\`phone\`) <> 10 OR \`phone\` NOT REGEXP '^[0-9]{10}$')
    `);
    await queryRunner.query(`
      ALTER TABLE \`stores\` CHANGE \`phone\` \`phone\` varchar(10) NULL
    `);

    await queryRunner.query(`ALTER TABLE \`stores\` DROP COLUMN \`place_id\``);
    await queryRunner.query(`ALTER TABLE \`stores\` DROP COLUMN \`createdAt\``);
    await queryRunner.query(`ALTER TABLE \`stores\` DROP COLUMN \`updatedAt\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`stores\`
      ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    `);
    await queryRunner.query(`
      ALTER TABLE \`stores\`
      ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    `);
    await queryRunner.query(`
      ALTER TABLE \`stores\` ADD \`place_id\` varchar(255) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`stores\` CHANGE \`phone\` \`phone\` varchar(255) NULL
    `);
    await queryRunner.query(`ALTER TABLE \`stores\` DROP COLUMN \`emedix_name\``);
  }
}
