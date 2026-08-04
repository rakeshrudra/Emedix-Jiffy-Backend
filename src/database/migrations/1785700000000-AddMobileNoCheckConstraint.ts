import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMobileNoCheckConstraint1785700000000
  implements MigrationInterface
{
  name = 'AddMobileNoCheckConstraint1785700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
      CHANGE \`mobile_no\` \`mobile_no\` varchar(10) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`users\`
      ADD CONSTRAINT \`CHK_users_mobile_no_10_digits\` CHECK (\`mobile_no\` REGEXP '^[0-9]{10}$')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
      DROP CONSTRAINT \`CHK_users_mobile_no_10_digits\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`users\`
      CHANGE \`mobile_no\` \`mobile_no\` varchar(255) NOT NULL
    `);
  }
}
