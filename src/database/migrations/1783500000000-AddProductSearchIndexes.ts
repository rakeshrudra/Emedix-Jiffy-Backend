import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSearchIndexes1783500000000 implements MigrationInterface {
  name = 'AddProductSearchIndexes1783500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`IDX_products_product_company\` ON \`products\` (\`productCompany\`)`,
    );
    await queryRunner.query(
      `CREATE FULLTEXT INDEX \`FTX_products_product_composition\` ON \`products\` (\`productComposition\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`FTX_products_product_composition\` ON \`products\``);
    await queryRunner.query(`DROP INDEX \`IDX_products_product_company\` ON \`products\``);
  }
}
