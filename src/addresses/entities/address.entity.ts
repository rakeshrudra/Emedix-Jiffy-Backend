import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type AddressLabel = 'Home' | 'Work' | 'Other';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ['Home', 'Work', 'Other'], default: 'Other' })
  label: AddressLabel;

  @Column({ name: 'address_line_1', default: '' })
  address_line_1: string;

  @Column({ name: 'address_line_2', default: '' })
  address_line_2: string;

  @Column({ name: 'formatted_address', type: 'text' })
  formatted_address: string;

  @Column({ name: 'place_id', nullable: true })
  place_id: string | null;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  pincode: string;

  @Column({ default: 'India' })
  country: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'enum', enum: ['gps', 'manual', 'places'], default: 'manual' })
  source: 'gps' | 'manual' | 'places';

  @Column({ name: 'is_default', default: false })
  is_default: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
