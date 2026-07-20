import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
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

  // Nullable because unique constraint prevents default ''; set after Firebase auth
  @Index()
  @Column({ name: 'firebase_uid', nullable: true, unique: true })
  firebase_uid: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
