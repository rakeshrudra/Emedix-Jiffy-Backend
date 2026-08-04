import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminRoles1785600000000 implements MigrationInterface {
  name = 'AddAdminRoles1785600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`admins\`
      ADD \`role\` enum('ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'ADMIN' AFTER \`store_id\`
    `);

    await queryRunner.query(`ALTER TABLE \`admins\` DROP FOREIGN KEY \`FK_admins_store\``);

    await queryRunner.query(`
      ALTER TABLE \`admins\`
      MODIFY \`store_id\` varchar(255) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`admins\`
      ADD CONSTRAINT \`FK_admins_store\`
      FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`store_id\`) ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`admins\` DROP FOREIGN KEY \`FK_admins_store\``);

    await queryRunner.query(`
      ALTER TABLE \`admins\`
      MODIFY \`store_id\` varchar(255) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`admins\`
      ADD CONSTRAINT \`FK_admins_store\`
      FOREIGN KEY (\`store_id\`) REFERENCES \`stores\` (\`store_id\`) ON DELETE RESTRICT
    `);

    await queryRunner.query(`ALTER TABLE \`admins\` DROP COLUMN \`role\``);
  }
}
