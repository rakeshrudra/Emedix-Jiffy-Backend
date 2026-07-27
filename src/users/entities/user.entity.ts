import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mobile_no', unique: true })
  mobile_no: string;

  @Column({ default: '' })
  name: string;

  @Index()
  @Column({ name: 'firebase_uid', nullable: true, unique: true })
  firebase_uid: string;

  @Column({ name: 'fcm_token', nullable: true })
  fcm_token: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
