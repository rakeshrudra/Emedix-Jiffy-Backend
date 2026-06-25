import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedStoresEntity1781356356086 implements MigrationInterface {
    name = 'AddedStoresEntity1781356356086'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`stores\` (\`id\` varchar(36) NOT NULL, \`erp_store_code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`address_line_1\` varchar(255) NOT NULL DEFAULT '', \`formatted_address\` text NOT NULL, \`place_id\` varchar(255) NULL, \`city\` varchar(255) NOT NULL, \`state\` varchar(255) NOT NULL, \`pincode\` varchar(255) NOT NULL, \`country\` varchar(255) NOT NULL DEFAULT 'India', \`latitude\` decimal(10,7) NOT NULL, \`longitude\` decimal(10,7) NOT NULL, \`delivery_radius_km\` decimal(5,2) NOT NULL DEFAULT '5.00', \`phone\` varchar(255) NULL, \`opening_time\` time NULL, \`closing_time\` time NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_adca535bb6bcf52e8080f018e3\` (\`latitude\`), INDEX \`IDX_d9e42399a70db3a36832116053\` (\`longitude\`), UNIQUE INDEX \`IDX_a08531b4d15190f3615d0bee87\` (\`erp_store_code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`addresses\` ADD \`place_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_0fd54ced5cc75f7cb92925dd80\` (\`firebase_uid\`)`);
        await queryRunner.query(`ALTER TABLE \`order_status_logs\` CHANGE \`notes\` \`notes\` text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`prescriptionUrls\` \`prescriptionUrls\` text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`cancellationReason\` \`cancellationReason\` text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`order_items\` CHANGE \`productComposition\` \`productComposition\` text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`addresses\` CHANGE \`source\` \`source\` enum ('gps', 'manual', 'places') NOT NULL DEFAULT 'manual'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`addresses\` CHANGE \`source\` \`source\` enum ('gps', 'manual') NOT NULL DEFAULT 'manual'`);
        await queryRunner.query(`ALTER TABLE \`order_items\` CHANGE \`productComposition\` \`productComposition\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`cancellationReason\` \`cancellationReason\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`orders\` CHANGE \`prescriptionUrls\` \`prescriptionUrls\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`order_status_logs\` CHANGE \`notes\` \`notes\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_0fd54ced5cc75f7cb92925dd80\``);
        await queryRunner.query(`ALTER TABLE \`addresses\` DROP COLUMN \`place_id\``);
        await queryRunner.query(`DROP INDEX \`IDX_a08531b4d15190f3615d0bee87\` ON \`stores\``);
        await queryRunner.query(`DROP INDEX \`IDX_d9e42399a70db3a36832116053\` ON \`stores\``);
        await queryRunner.query(`DROP INDEX \`IDX_adca535bb6bcf52e8080f018e3\` ON \`stores\``);
        await queryRunner.query(`DROP TABLE \`stores\``);
    }

}
