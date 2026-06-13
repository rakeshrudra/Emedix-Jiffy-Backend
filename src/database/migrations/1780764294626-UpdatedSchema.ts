import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedSchema1780764294626 implements MigrationInterface {
    name = 'UpdatedSchema1780764294626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_0fd54ced5cc75f7cb92925dd80\` ON \`users\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_0fd54ced5cc75f7cb92925dd80\` (\`firebase_uid\`)`);
        await queryRunner.query(`ALTER TABLE \`order_items\` CHANGE \`productComposition\` \`productComposition\` text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`order_status_logs\` CHANGE \`notes\` \`notes\` text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`prescriptionUrls\` \`prescriptionUrls\` text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`cancellationReason\` \`cancellationReason\` text NOT NULL DEFAULT ''`);
        await queryRunner.query(`CREATE INDEX \`IDX_270b1a4eb00eebe56b528e909f\` ON \`products\` (\`productName\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_270b1a4eb00eebe56b528e909f\` ON \`products\``);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`cancellationReason\` \`cancellationReason\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`prescriptionUrls\` \`prescriptionUrls\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`order_status_logs\` CHANGE \`notes\` \`notes\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`order_items\` CHANGE \`productComposition\` \`productComposition\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_0fd54ced5cc75f7cb92925dd80\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_0fd54ced5cc75f7cb92925dd80\` ON \`users\` (\`firebase_uid\`)`);
    }

}
