import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
  }

  /**
   * POST /api/auth/verify-token
   * 1. Verify Firebase ID Token
   * 2. Find or create user by phone number
   * 3. Store firebase_uid for account-merge edge case handling
   * 4. Return short-lived access token + long-lived refresh token
   */
  async verifyFirebaseToken(idToken: string) {
    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      this.logger.error(`Firebase token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }

    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      throw new UnauthorizedException('Token does not contain a phone number. Ensure phone auth is used.');
    }

    const mobile_no = phoneNumber.replace(/^\+91/, '');
    const firebase_uid = decodedToken.uid;

    this.logger.log(`Firebase token verified for: ${phoneNumber}`);

    // Find existing user or create new one
    let user = await this.usersService.findByMobile(mobile_no);
    const is_new_user = !user;

    if (!user) {
      user = await this.usersService.create({ mobile_no, firebase_uid });
      this.logger.log(`New user created for mobile: ${mobile_no}`);
    } else if (!user.firebase_uid) {
      // Back-fill firebase_uid for users who registered before this field existed
      user = await this.usersService.updateProfile(user.id, { firebase_uid });
    }

    const tokens = this.issueTokens(user.id, user.mobile_no);

    return {
      success: true,
      message: 'Authentication successful',
      data: {
        ...tokens,
        is_new_user,
        user: {
          id: user.id,
          mobile_no: user.mobile_no,
          name: user.name ?? null,
        },
      },
    };
  }

  /**
   * POST /api/auth/refresh
   * Validates the refresh token and returns a fresh access token.
   */
  async refreshAccessToken(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired. Please log in again.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      success: true,
      data: {
        access_token: this.jwtService.sign(
          { sub: user.id, mobile_no: user.mobile_no, type: 'access' },
          { expiresIn: '15m' },
        ),
      },
    };
  }

  /**
   * PATCH /api/auth/profile
   * Updates the authenticated user's name.
   */
  async updateProfile(userId: string, name: string) {
    const user = await this.usersService.updateProfile(userId, { name: name.trim() });
    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        mobile_no: user.mobile_no,
        name: user.name,
      },
    };
  }

  /**
   * GET /api/auth/me
   */
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return {
      success: true,
      message: 'User profile fetched successfully',
      data: {
        id: user.id,
        mobile_no: user.mobile_no,
        name: user.name ?? null,
        created_at: user.createdAt,
      },
    };
  }

  /**
   * PUT /api/auth/fcm-token
   * Saves/updates the device's FCM registration token for order status push notifications.
   */
  async updateFcmToken(userId: string, fcmToken: string) {
    await this.usersService.updateFcmToken(userId, fcmToken);
    return {
      success: true,
      message: 'FCM token updated successfully',
    };
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private issueTokens(userId: string, mobile_no: string) {
    const access_token = this.jwtService.sign(
      { sub: userId, mobile_no, type: 'access' },
      { expiresIn: '15m' },
    );

    const refresh_token = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { secret: this.refreshSecret, expiresIn: '30d' },
    );

    return { access_token, refresh_token };
  }
}
