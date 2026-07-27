import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AdminOrderSummary } from './orders.service';

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
 * own store, keyed off the same admin_access_token cookie the REST API uses
 * — no separate socket auth scheme to maintain.
 */
@WebSocketGateway({
  namespace: '/admin',
  cors: {
    origin: [process.env.ADMIN_DASHBOARD_URL, 'http://localhost:5173'].filter(
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
  ) { }

  async handleConnection(client: Socket) {
    const token = parseCookie(client.handshake.headers.cookie, 'admin_access_token');

    try {
      if (!token) throw new Error('Missing admin_access_token cookie');

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('ADMIN_JWT_ACCESS_SECRET'),
      });
      if (payload.token_type !== 'admin_access') {
        throw new Error('Invalid token type');
      }

      await client.join(`store:${payload.store_id}`);
    } catch (error) {
      this.logger.warn(`Rejecting admin socket connection: ${error.message}`);
      client.disconnect(true);
    }
  }

  emitNewOrder(store_id: string, order: AdminOrderSummary): void {
    this.server.to(`store:${store_id}`).emit('order:new', order);
  }
}
