import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreOwnerRole1787740000000 implements MigrationInterface {
  name = 'AddStoreOwnerRole1787740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`admins\` CHANGE \`role\` \`role\` enum ('emedix_superadmin', 'emedix_admin', 'emedix_purchase_admin', 'emedix_purchase_staff', 'emedix_delx', 'emedix_accountant', 'emedix_op_admin', 'store_owner', 'store_admin', 'store_staff') NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`admins\` CHANGE \`role\` \`role\` enum ('emedix_superadmin', 'emedix_admin', 'emedix_purchase_admin', 'emedix_purchase_staff', 'emedix_delx', 'emedix_accountant', 'emedix_op_admin', 'store_admin', 'store_staff') NOT NULL`);
  }
}
