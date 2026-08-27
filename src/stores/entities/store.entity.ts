import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('stores')
export class Store {
  @PrimaryColumn({ name: 'store_id', type: 'varchar', length: 20 })
  store_id: string;

  @Column({ name: 'emedix_name' })
  emedix_name: string;

  @Column()
  name: string;

  @Column({ name: 'address_line_1', default: '' })
  address_line_1: string;

  @Column({ name: 'formatted_address', type: 'text' })
  formatted_address: string;

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
  delivery_radius_km: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  phone: string | null;

  @Column({ name: 'opening_time', type: 'time', nullable: true })
  opening_time: string | null;

  @Column({ name: 'closing_time', type: 'time', nullable: true })
  closing_time: string | null;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;
}
