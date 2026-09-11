import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AppPlatform {
  ANDROID = 'android',
}

@Entity('app_versions')
export class AppVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: AppPlatform, unique: true })
  platform: AppPlatform;

  @Column({ name: 'min_supported_version', type: 'varchar', length: 20 })
  min_supported_version: string;

  @Column({ name: 'latest_version', type: 'varchar', length: 20 })
  latest_version: string;

  @Column({ name: 'store_url', type: 'varchar', length: 255 })
  store_url: string;

  @Column({ name: 'release_notes', type: 'text', nullable: true })
  release_notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
