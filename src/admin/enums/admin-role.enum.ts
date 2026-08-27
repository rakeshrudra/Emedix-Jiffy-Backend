export enum AdminRole {
  EMEDIX_SUPERADMIN = 'emedix_superadmin',
  EMEDIX_ADMIN = 'emedix_admin',
  EMEDIX_PURCHASE_ADMIN = 'emedix_purchase_admin',
  EMEDIX_PURCHASE_STAFF = 'emedix_purchase_staff',
  EMEDIX_DELX = 'emedix_delx',
  EMEDIX_ACCOUNTANT = 'emedix_accountant',
  EMEDIX_OP_ADMIN = 'emedix_op_admin',
  STORE_OWNER = 'store_owner',
  STORE_ADMIN = 'store_admin',
  STORE_STAFF = 'store_staff',
}

export const SUPER_ADMIN_ROLE = AdminRole.EMEDIX_SUPERADMIN;
