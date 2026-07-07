import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowMultipleStoreCarts1783420000000 implements MigrationInterface {
  name = 'AllowMultipleStoreCarts1783420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_carts_user_store\` ON \`carts\` (\`user_id\`, \`store_id\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`UQ_carts_user_store\` ON \`carts\``);
  }
}
