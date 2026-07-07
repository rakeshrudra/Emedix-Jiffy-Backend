import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoicesService } from './invoices.service';

@Module({
    imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem])],
    providers: [InvoicesService],
    exports: [InvoicesService],
})
export class InvoicesModule {}
