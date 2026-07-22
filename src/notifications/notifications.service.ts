import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { UsersService } from '../users/users.service';

// Tokens Firebase considers permanently dead — app uninstalled, token rotated without re-registering, etc. Safe to drop so we stop retrying.
const UNREGISTERED_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

export interface OrderPushPayload {
  orderId: number;
  orderNumber: string;
  status: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly usersService: UsersService) { }

  /**
   * Best-effort push send. Never throws — a notification failure must not
   * affect the order status update it's reporting on.
   */
  async sendOrderStatusUpdate(
    userId: string,
    title: string,
    body: string,
    payload: OrderPushPayload,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      if (!user?.fcm_token) return;

      await admin.messaging().send({
        token: user.fcm_token,
        notification: { title, body },
        data: {
          type: 'ORDER_STATUS_UPDATE',
          orderId: String(payload.orderId),
          orderNumber: payload.orderNumber,
          status: payload.status,
        },
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
    } catch (error) {
      const code = error?.code as string | undefined;

      if (code && UNREGISTERED_ERROR_CODES.has(code)) {
        this.logger.warn(`Dropping dead FCM token for user ${userId} (${code})`);
        await this.usersService.clearFcmToken(userId).catch(() => { });
        return;
      }

      this.logger.warn(
        `Push notification failed for user ${userId}: ${error?.message ?? error}`,
      );
    }
  }
}
