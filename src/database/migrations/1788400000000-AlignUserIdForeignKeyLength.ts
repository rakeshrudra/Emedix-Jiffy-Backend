import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * users.id is varchar(36) (UUID), but every column referencing it as a
 * foreign key was left at TypeORM's default varchar(255). Aligns all of
 * them to varchar(36) to match the referenced primary key exactly.
 * Also shrinks orders.idempotency_key, a client-generated UUID that was
 * left at the same varchar(255) default.
 */
export class AlignUserIdForeignKeyLength1788400000000
  implements MigrationInterface
{
  name = 'AlignUserIdForeignKeyLength1788400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`orders\` MODIFY COLUMN \`idempotency_key\` varchar(36) NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE \`addresses\` DROP FOREIGN KEY \`FK_16aac8a9f6f9c1dd6bcb75ec023\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` MODIFY COLUMN \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` ADD CONSTRAINT \`FK_16aac8a9f6f9c1dd6bcb75ec023\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_carts_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` MODIFY COLUMN \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` ADD CONSTRAINT \`FK_carts_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` MODIFY COLUMN \`user_id\` varchar(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_orders_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_orders_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` MODIFY COLUMN \`user_id\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_orders_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)`,
    );

    await queryRunner.query(
      `ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_carts_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` MODIFY COLUMN \`user_id\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`carts\` ADD CONSTRAINT \`FK_carts_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE \`addresses\` DROP FOREIGN KEY \`FK_16aac8a9f6f9c1dd6bcb75ec023\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` MODIFY COLUMN \`user_id\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`addresses\` ADD CONSTRAINT \`FK_16aac8a9f6f9c1dd6bcb75ec023\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `ALTER TABLE \`orders\` MODIFY COLUMN \`idempotency_key\` varchar(255) NOT NULL`,
    );
  }
}
