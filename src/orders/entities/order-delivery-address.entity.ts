import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_delivery_addresses')
export class OrderDeliveryAddress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Order, (order) => order.deliveryAddress, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ name: 'source_address_id', nullable: true })
    sourceAddressId: string | null;

    @Column({ name: 'label', default: 'Other' })
    label: string;

    @Column({ name: 'address_line_1', default: '' })
    addressLine1: string;

    @Column({ name: 'address_line_2', default: '' })
    addressLine2: string;

    @Column({ name: 'formatted_address', type: 'text' })
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

    @CreateDateColumn()
    createdAt: Date;
}
