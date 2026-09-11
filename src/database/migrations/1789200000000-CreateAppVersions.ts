import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppVersions1789200000000 implements MigrationInterface {
  name = 'CreateAppVersions1789200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`app_versions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`platform\` enum ('android') NOT NULL,
        \`min_supported_version\` varchar(20) NOT NULL,
        \`latest_version\` varchar(20) NOT NULL,
        \`store_url\` varchar(255) NOT NULL,
        \`release_notes\` text NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_app_versions_platform\` (\`platform\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `INSERT INTO \`app_versions\` (\`platform\`, \`min_supported_version\`, \`latest_version\`, \`store_url\`, \`release_notes\`)
       VALUES ('android', '1.0.0', '1.0.0', 'https://play.google.com/store/apps/details?id=com.managix.emedixjifi', NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`app_versions\``);
  }
}
