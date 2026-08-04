import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { AdminRole } from '../enums/admin-role.enum';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column({ name: 'store_id', nullable: true })
  store_id: string | null;

  @Column({ type: 'enum', enum: AdminRole, default: AdminRole.ADMIN })
  role: AdminRole;

  @ManyToOne(() => Store, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'store_id', referencedColumnName: 'store_id' })
  store: Store | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
