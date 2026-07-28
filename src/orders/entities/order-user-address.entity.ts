import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_user_addresses')
export class OrderUserAddress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Order, (order) => order.user_address, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ name: 'source_address_id', nullable: true })
    source_address_id: string | null;

    @Column({ name: 'label', default: 'Other' })
    label: string;

    @Column({ name: 'address_line_1', default: '' })
    address_line_1: string;

    @Column({ name: 'address_line_2', default: '' })
    address_line_2: string;

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

    @Column('decimal', { precision: 10, scale: 7 })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 7 })
    longitude: number;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}
