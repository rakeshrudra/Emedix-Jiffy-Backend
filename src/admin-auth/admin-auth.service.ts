import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { StoresService } from '../stores/stores.service';
import { ADMIN_AUTH_DEFAULTS } from './constants/admin-auth.constants';
import { AdminSignupDto } from './dto/admin-signup.dto';
import { Admin } from './entities/admin.entity';
import {
  AdminAccessTokenPayload,
  AdminRefreshTokenPayload,
} from './interfaces/admin-jwt-payload.interface';

export interface SafeAuthenticatedAdmin {
  id: string;
  username: string;
  store_id: string;
  store_name: string;
}

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly storesService: StoresService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: AdminSignupDto) {
    if (this.configService.get<string>('ENABLE_ADMIN_SIGNUP') === 'false') {
      throw new ForbiddenException('Admin signup is disabled');
    }

    const username = this.normalizeUsername(dto.username);
    const existing = await this.adminRepository.findOne({
      where: { username },
    });
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const store = await this.storesService.findStoreForAdminByStoreId(
      dto.store_id,
    );
    const passwordHash = await bcrypt.hash(
      dto.password,
      ADMIN_AUTH_DEFAULTS.bcryptSaltRounds,
    );

    const admin = await this.adminRepository.save(
      this.adminRepository.create({
        username,
        passwordHash,
        storeId: dto.store_id,
      }),
    );

    return {
      success: true,
      message: 'Admin account created successfully',
      data: {
        id: admin.id,
        username: admin.username,
        store_id: admin.storeId,
        store_name: store.name,
        created_at: admin.createdAt,
      },
    };
  }

  async login(usernameInput: string, password: string) {
    const username = this.normalizeUsername(usernameInput);
    const admin = await this.adminRepository.findOne({ where: { username } });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const store = await this.storesService.findStoreForAdminByStoreId(
      admin.storeId,
    );
    const tokens = this.issueTokens(admin);

    return {
      success: true,
      message: 'Admin login successful',
      data: {
        ...tokens,
        admin: {
          id: admin.id,
          username: admin.username,
          store_id: admin.storeId,
          store_name: store.name,
        },
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: AdminRefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('ADMIN_JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (payload.token_type !== 'admin_refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const admin = await this.findExistingAdmin(payload.sub);
    await this.storesService.findStoreForAdminByStoreId(admin.storeId);

    return {
      success: true,
      data: this.issueTokens(admin),
    };
  }

  async getCurrentAdmin(adminId: string) {
    const admin = await this.findExistingAdmin(adminId);
    const store = await this.storesService.findStoreForAdminByStoreId(
      admin.storeId,
    );

    return {
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        store: {
          id: admin.storeId,
          name: store.name,
        },
      },
    };
  }

  async validateAdminAccessPayload(
    payload: AdminAccessTokenPayload,
  ): Promise<SafeAuthenticatedAdmin> {
    const admin = await this.findExistingAdmin(payload.sub);
    const store = await this.storesService.findStoreForAdminByStoreId(
      admin.storeId,
    );

    return {
      id: admin.id,
      username: admin.username,
      store_id: admin.storeId,
      store_name: store.name,
    };
  }

  logout() {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  private async findExistingAdmin(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new UnauthorizedException('Admin no longer exists');
    }

    return admin;
  }

  private issueTokens(admin: Admin) {
    const accessPayload: AdminAccessTokenPayload = {
      sub: admin.id,
      username: admin.username,
      store_id: admin.storeId,
      token_type: 'admin_access',
    };
    const refreshPayload: AdminRefreshTokenPayload = {
      sub: admin.id,
      token_type: 'admin_refresh',
    };

    return {
      access_token: this.jwtService.sign(accessPayload, {
        secret: this.configService.get<string>('ADMIN_JWT_ACCESS_SECRET'),
        expiresIn: this.getExpiresIn(
          'ADMIN_JWT_ACCESS_EXPIRES_IN',
          ADMIN_AUTH_DEFAULTS.accessTokenExpiresIn,
        ),
      }),
      refresh_token: this.jwtService.sign(refreshPayload, {
        secret: this.configService.get<string>('ADMIN_JWT_REFRESH_SECRET'),
        expiresIn: this.getExpiresIn(
          'ADMIN_JWT_REFRESH_EXPIRES_IN',
          ADMIN_AUTH_DEFAULTS.refreshTokenExpiresIn,
        ),
      }),
    };
  }

  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  private getExpiresIn(
    key: string,
    fallback: string,
  ): NonNullable<JwtSignOptions['expiresIn']> {
    return (this.configService.get<string>(key) ?? fallback) as NonNullable<
      JwtSignOptions['expiresIn']
    >;
  }
}
