import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameOrderUserAddressesAddRecipientFields1785600000000
  implements MigrationInterface
{
  name = 'RenameOrderUserAddressesAddRecipientFields1785600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `RENAME TABLE \`order_user_addresses\` TO \`order_delivery_addresses\``,
    );

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      CHANGE \`fulfillment_type\` \`fulfillment_type\` enum('PICKUP','DELIVERY') NOT NULL AFTER \`status\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD COLUMN \`recipient_name\` varchar(255) NOT NULL DEFAULT '' AFTER \`fulfillment_type\`,
      ADD COLUMN \`recipient_mobile_number\` varchar(10) NOT NULL DEFAULT '' AFTER \`recipient_name\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ALTER COLUMN \`recipient_name\` DROP DEFAULT,
      ALTER COLUMN \`recipient_mobile_number\` DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      DROP COLUMN \`recipient_mobile_number\`,
      DROP COLUMN \`recipient_name\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      CHANGE \`fulfillment_type\` \`fulfillment_type\` enum('PICKUP','DELIVERY') NOT NULL AFTER \`created_at\`
    `);

    await queryRunner.query(
      `RENAME TABLE \`order_delivery_addresses\` TO \`order_user_addresses\``,
    );
  }
}
