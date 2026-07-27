import { ApiProperty } from '@nestjs/swagger';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    Index,
} from 'typeorm';
import { Order } from './order.entity';

export enum OrderActor {
    USER = 'USER',
    ERP = 'ERP',
    SYSTEM = 'SYSTEM',
    STORE = 'STORE',
}

@Entity('order_status_logs')
export class OrderStatusLog {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => Order, (order) => order.status_logs, { onDelete: 'CASCADE' })
    order: Order;

    // null means this is the first status (order creation — no previous state)
    @ApiProperty({ example: 'PENDING' })
    @Column({ name: 'from_status', nullable: true })
    from_status: string;

    @ApiProperty({ example: 'CONFIRMED' })
    @Column({ name: 'to_status' })
    to_status: string;

    @ApiProperty({ enum: OrderActor, example: OrderActor.ERP })
    @Column({ type: 'enum', enum: OrderActor })
    actor: OrderActor;

    @ApiProperty({ example: 'ERP acknowledged with ID SW-12345' })
    @Column({ type: 'text', default: '' })
    notes: string;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}
