import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameOrderDeliveryAddressesToOrderUserAddresses1785400000000
  implements MigrationInterface
{
  name = 'RenameOrderDeliveryAddressesToOrderUserAddresses1785400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'RENAME TABLE `order_delivery_addresses` TO `order_user_addresses`',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'RENAME TABLE `order_user_addresses` TO `order_delivery_addresses`',
    );
  }
}
