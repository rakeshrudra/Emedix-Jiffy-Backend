import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmedixWebhookModule } from './emedix-webhook/emedix-webhook.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AddressesModule } from './addresses/addresses.module';
import { MapsModule } from './maps/maps.module';
import { OrdersModule } from './orders/orders.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ProductsModule } from './products/products.module';
import { RedisModule } from './redis/redis.module';
import { InvoicesModule } from './invoices/invoices.module';
import { StoresModule } from './stores/stores.module';
import { DemoModule } from './demo/demo.module';
import databaseConfig from './database/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),
    FirebaseModule,
    EmedixWebhookModule,
    AuthModule,
    UsersModule,
    AddressesModule,
    MapsModule,
    OrdersModule,
    ProductsModule,
    RedisModule,
    InvoicesModule,
    StoresModule,
    DemoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
