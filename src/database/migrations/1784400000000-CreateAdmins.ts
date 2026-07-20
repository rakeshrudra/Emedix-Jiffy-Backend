import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdmins1784400000000 implements MigrationInterface {
  name = 'CreateAdmins1784400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`admins\` (
        \`id\` varchar(36) NOT NULL,
        \`username\` varchar(255) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`store_id\` varchar(255) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_admins_username\` (\`username\`),
        INDEX \`IDX_admins_store_id\` (\`store_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `admins`');
  }
}
