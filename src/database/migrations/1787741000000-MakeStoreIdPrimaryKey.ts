import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeStoreIdPrimaryKey1787741000000 implements MigrationInterface {
  name = 'MakeStoreIdPrimaryKey1787741000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`stores\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`stores\` DROP INDEX \`IDX_stores_store_id\``);
    await queryRunner.query(`ALTER TABLE \`stores\` MODIFY COLUMN \`store_id\` varchar(20) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`stores\` ADD PRIMARY KEY (\`store_id\`)`);
    await queryRunner.query(`ALTER TABLE \`stores\` DROP COLUMN \`id\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`stores\` ADD \`id\` varchar(36) NOT NULL`);
    await queryRunner.query(`UPDATE \`stores\` SET \`id\` = (SELECT UUID())`);
    await queryRunner.query(`ALTER TABLE \`stores\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`stores\` MODIFY COLUMN \`store_id\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`stores\` ADD PRIMARY KEY (\`id\`)`);
    await queryRunner.query(`ALTER TABLE \`stores\` ADD UNIQUE INDEX \`IDX_stores_store_id\` (\`store_id\`)`);
  }
}
