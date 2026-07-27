import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameScheduleFieldsAddCancelledByDropStatusLogs1785200000000
  implements MigrationInterface
{
  name = 'RenameScheduleFieldsAddCancelledByDropStatusLogs1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      CHANGE \`scedule_starttime\` \`scheduled_start_time\` time NULL,
      CHANGE \`schedule_endtime\` \`scheduled_end_time\` time NULL,
      ADD \`cancelled_by\` enum('USER','STORE') NULL
    `);

    await queryRunner.query('DROP TABLE IF EXISTS `order_status_logs`');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`order_status_logs\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orderId\` int NOT NULL,
        \`from_status\` varchar(255) NULL,
        \`to_status\` varchar(255) NOT NULL,
        \`actor\` enum('USER','ERP','SYSTEM','STORE') NOT NULL,
        \`notes\` text NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_order_status_logs_order_id\` (\`orderId\`),
        CONSTRAINT \`FK_order_status_logs_order\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      DROP COLUMN \`cancelled_by\`,
      CHANGE \`scheduled_start_time\` \`scedule_starttime\` time NULL,
      CHANGE \`scheduled_end_time\` \`schedule_endtime\` time NULL
    `);
  }
}
