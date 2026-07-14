import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id', unique: true })
  storeId: string;

  @Column()
  name: string;

  @Column({ name: 'address_line_1', default: '' })
  addressLine1: string;

  @Column({ name: 'formatted_address', type: 'text' })
  formattedAddress: string;

  @Column({ name: 'place_id', nullable: true })
  placeId: string | null;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  pincode: string;

  @Column({ default: 'India' })
  country: string;

  @Index()
  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Index()
  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column('decimal', { name: 'delivery_radius_km', precision: 5, scale: 2, default: 5.0 })
  deliveryRadiusKm: number;

  @Column({ nullable: true })
  phone: string | null;

  @Column({ name: 'opening_time', type: 'time', nullable: true })
  openingTime: string | null;

  @Column({ name: 'closing_time', type: 'time', nullable: true })
  closingTime: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
