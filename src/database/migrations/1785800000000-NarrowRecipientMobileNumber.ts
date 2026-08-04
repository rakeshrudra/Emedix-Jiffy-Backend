import { MigrationInterface, QueryRunner } from 'typeorm';

export class NarrowRecipientMobileNumber1785800000000
  implements MigrationInterface
{
  name = 'NarrowRecipientMobileNumber1785800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      CHANGE \`recipient_mobile_number\` \`recipient_mobile_number\` varchar(10) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      CHANGE \`recipient_mobile_number\` \`recipient_mobile_number\` varchar(20) NOT NULL
    `);
  }
}
