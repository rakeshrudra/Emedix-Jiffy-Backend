import { ApiProperty } from '@nestjs/swagger';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
    @ApiProperty({ example: 1 })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ example: 'John Doe' })
    @Column({ length: 100 })
    name: string;

    @ApiProperty({ example: 'john@example.com' })
    @Column({ unique: true, length: 255 })
    email: string;

    @ApiProperty({ example: '2026-02-24T12:00:00Z' })
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty({ example: '2026-02-24T12:00:00Z' })
    @UpdateDateColumn()
    updatedAt: Date;
}
