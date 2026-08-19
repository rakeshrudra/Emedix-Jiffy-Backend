import { MigrationInterface, QueryRunner } from 'typeorm';

const NEW_ROLES =
  "'emedix_superadmin','emedix_admin','emedix_purchase_admin','emedix_purchase_staff','emedix_delx','emedix_accountant','emedix_op_admin','store_admin','store_staff'";
const OLD_ROLES = "'ADMIN','SUPER_ADMIN'";

/**
 * Aligns Jiffy's admins.role values with Auth Service's IdentityRole enum.
 * Only emedix_superadmin acts as super admin; every other value acts as a
 * regular admin for now (see AdminRolesGuard) — proper per-role access
 * control is deferred.
 */
export class AlignAdminRolesWithIdentity1787060614801
  implements MigrationInterface
{
  name = 'AlignAdminRolesWithIdentity1787060614801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Widen the enum first so existing rows remain valid while migrating.
    await queryRunner.query(`
      ALTER TABLE \`admins\`
      MODIFY \`role\` enum(${OLD_ROLES}, ${NEW_ROLES}) NOT NULL
    `);

    await queryRunner.query(
      `UPDATE \`admins\` SET \`role\` = 'emedix_superadmin' WHERE \`role\` = 'SUPER_ADMIN'`,
    );
    await queryRunner.query(
      `UPDATE \`admins\` SET \`role\` = 'emedix_admin' WHERE \`role\` = 'ADMIN'`,
    );

    await queryRunner.query(`
      ALTER TABLE \`admins\`
      MODIFY \`role\` enum(${NEW_ROLES}) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`admins\`
      MODIFY \`role\` enum(${NEW_ROLES}, ${OLD_ROLES}) NOT NULL
    `);

    await queryRunner.query(
      `UPDATE \`admins\` SET \`role\` = 'SUPER_ADMIN' WHERE \`role\` = 'emedix_superadmin'`,
    );
    await queryRunner.query(
      `UPDATE \`admins\` SET \`role\` = 'ADMIN' WHERE \`role\` != 'SUPER_ADMIN'`,
    );

    await queryRunner.query(`
      ALTER TABLE \`admins\`
      MODIFY \`role\` enum(${OLD_ROLES}) NOT NULL DEFAULT 'ADMIN'
    `);
  }
}
