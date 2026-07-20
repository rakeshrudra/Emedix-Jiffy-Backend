import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepositionStoresColumns1784700000000
  implements MigrationInterface {
  name = 'RepositionStoresColumns1784700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`stores\`
      MODIFY \`store_id\` varchar(255) NOT NULL AFTER \`id\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`stores\`
      ADD UNIQUE INDEX \`IDX_stores_store_id\` (\`store_id\`)
    `);
    await queryRunner.query(`
      ALTER TABLE \`stores\`
      MODIFY \`emedix_name\` varchar(255) NOT NULL AFTER \`store_id\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`stores\` DROP INDEX \`IDX_stores_store_id\`
    `);
  }
}
