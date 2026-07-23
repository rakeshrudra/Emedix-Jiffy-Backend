import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
