import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameOrderActorAdminToStore1784563459034
  implements MigrationInterface
{
  name = 'RenameOrderActorAdminToStore1784563459034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Widen the enum first so existing 'ADMIN' rows remain valid while migrating.
    await queryRunner.query(`
      ALTER TABLE \`order_status_logs\`
      MODIFY \`actor\` enum('USER','ERP','SYSTEM','ADMIN','STORE') NOT NULL
    `);
    await queryRunner.query(`
      UPDATE \`order_status_logs\` SET \`actor\` = 'STORE' WHERE \`actor\` = 'ADMIN'
    `);
    await queryRunner.query(`
      ALTER TABLE \`order_status_logs\`
      MODIFY \`actor\` enum('USER','ERP','SYSTEM','STORE') NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`order_status_logs\`
      MODIFY \`actor\` enum('USER','ERP','SYSTEM','ADMIN','STORE') NOT NULL
    `);
    await queryRunner.query(`
      UPDATE \`order_status_logs\` SET \`actor\` = 'ADMIN' WHERE \`actor\` = 'STORE'
    `);
    await queryRunner.query(`
      ALTER TABLE \`order_status_logs\`
      MODIFY \`actor\` enum('USER','ERP','SYSTEM','ADMIN') NOT NULL
    `);
  }
}
