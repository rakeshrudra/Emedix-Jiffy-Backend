import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameStoreIdColumn1783166200439 implements MigrationInterface {
    name = 'RenameStoreIdColumn1783166200439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`stores\` CHANGE \`erp_store_code\` \`store_id\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`storeId\` \`store_id\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`storeId\` \`store_id\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`invoices\` CHANGE \`storeId\` \`store_id\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`invoices\` CHANGE \`store_id\` \`storeId\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`store_id\` \`storeId\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`products\` CHANGE \`store_id\` \`storeId\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`stores\` CHANGE \`store_id\` \`erp_store_code\` varchar(255) NOT NULL`);
    }

}
