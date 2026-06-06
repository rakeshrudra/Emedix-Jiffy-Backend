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
    ADMIN = 'ADMIN',
}

@Entity('order_status_logs')
export class OrderStatusLog {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => Order, (order) => order.statusLogs, { onDelete: 'CASCADE' })
    order: Order;

    // null means this is the first status (order creation — no previous state)
    @ApiProperty({ example: 'PENDING' })
    @Column({ nullable: true })
    fromStatus: string;

    @ApiProperty({ example: 'CONFIRMED' })
    @Column()
    toStatus: string;

    @ApiProperty({ enum: OrderActor, example: OrderActor.ERP })
    @Column({ type: 'enum', enum: OrderActor })
    actor: OrderActor;

    @ApiProperty({ example: 'ERP acknowledged with ID SW-12345' })
    @Column({ type: 'text', default: '' })
    notes: string;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;
}
