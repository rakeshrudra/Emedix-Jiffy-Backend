import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderScheduleFields1784600000000 implements MigrationInterface {
  name = 'AddOrderScheduleFields1784600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD \`scheduled_date\` date NULL,
      ADD \`scedule_starttime\` time NULL,
      ADD \`schedule_endtime\` time NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      DROP COLUMN \`schedule_endtime\`,
      DROP COLUMN \`scedule_starttime\`,
      DROP COLUMN \`scheduled_date\`
    `);
  }
}
