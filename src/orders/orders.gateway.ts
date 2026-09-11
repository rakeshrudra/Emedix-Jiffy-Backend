import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AdminService } from '../admin/admin.service';
import { AdminOrderSummary } from './orders.service';

type AuthServiceAccessTokenPayload = {
  sub: string;
  mobile_no: string;
  role: string;
  type: 'access' | 'refresh';
};

function parseCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

/**
 * Admin dashboard live-order feed. Staff socket joins a room scoped to their
 * own store, keyed off the same SSO access_token cookie the REST API relies on.
 */
@WebSocketGateway({
  namespace: '/admin',
  cors: {
    origin: [process.env.ADMIN_DASHBOARD_URL, 'http://localhost:5174'].filter(
      Boolean,
    ),
    credentials: true,
  },
})
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly adminService: AdminService,
  ) { }

  async handleConnection(client: Socket) {
    const token = parseCookie(client.handshake.headers.cookie, 'access_token');

    try {
      if (!token) throw new Error('Missing access_token cookie');

      const payload =
        await this.jwtService.verifyAsync<AuthServiceAccessTokenPayload>(token, {
          algorithms: ['RS256'],
          publicKey: this.getPublicKey(),
        });

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      const admin = await this.adminService.findByIdentityId(payload.sub);
      if (!admin) {
        throw new Error('Admin is not provisioned');
      }

      await client.join(`store:${admin.store_id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Rejecting admin socket connection: ${message}`);
      client.disconnect(true);
    }
  }

  emitNewOrder(store_id: string, order: AdminOrderSummary): void {
    this.server.to(`store:${store_id}`).emit('order:new', order);
  }

  emitOrderUpdated(store_id: string, order: AdminOrderSummary): void {
    this.server.to(`store:${store_id}`).emit('order:updated', order);
  }

  private getPublicKey(): string {
    const key = this.configService.get<string>('JWT_PUBLIC_KEY');
    if (!key) {
      throw new Error('JWT_PUBLIC_KEY is required');
    }
    return key.replace(/\\n/g, '\n');
  }
}

export interface CustomerOrderUpdate {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  cancelled_at?: Date | null;
  cancellation_reason?: string | null;
  items: {
    id: number;
    product_code: string;
    product_name: string;
    qty: number;
    is_available?: boolean;
    confirmed_quantity?: number;
  }[];
}

/**
 * Customer mobile-app live-order feed. Client joins a room scoped to their
 * own user_id, authenticated with the same bearer JWT the REST API uses.
 */
@WebSocketGateway({
  namespace: '/orders',
  cors: {
    origin: true,
  },
})
export class CustomerOrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CustomerOrdersGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;

    try {
      if (!token) throw new Error('Missing auth token');

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        token,
        { secret: this.configService.get<string>('JWT_SECRET') },
      );

      if (!payload.sub) {
        throw new Error('Invalid token payload');
      }

      await client.join(`user:${payload.sub}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Rejecting customer socket connection: ${message}`);
      client.disconnect(true);
    }
  }

  emitOrderUpdated(user_id: string, order: CustomerOrderUpdate): void {
    this.server.to(`user:${user_id}`).emit('order:updated', order);
  }
}
