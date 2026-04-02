import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type AddressSource = 'gps' | 'manual';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  label: string;

  @Column({ name: 'address_line_1', nullable: true })
  addressLine1: string;

  @Column({ name: 'address_line_2', nullable: true })
  addressLine2: string;

  @Column({ name: 'formatted_address' })
  formattedAddress: string;

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

  /** 'gps' = reverse geocoded from coordinates | 'manual' = forward geocoded from text */
  @Column({ type: 'varchar', enum: ['gps', 'manual'], default: 'manual' })
  source: AddressSource;

  @CreateDateColumn()
  createdAt: Date;
}
