import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveryAddressToOrders1784200000000
  implements MigrationInterface
{
  name = 'AddDeliveryAddressToOrders1784200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD \`deliveryAddress\` text NULL`,
    );
    await queryRunner.query(
      `UPDATE \`orders\` SET \`deliveryAddress\` = '{}' WHERE \`deliveryAddress\` IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` CHANGE \`deliveryAddress\` \`deliveryAddress\` text NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`deliveryAddress\``);
  }
}
