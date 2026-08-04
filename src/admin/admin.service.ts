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
import { Store } from '../stores/entities/store.entity';
import { AdminSignupDto } from './dto/admin-signup.dto';
import { Admin } from './entities/admin.entity';
import { AdminRole } from './enums/admin-role.enum';

interface AdminAccessTokenPayload {
  sub: string;
  username: string;
  store_id: string | null;
  role: AdminRole;
  token_type: 'admin_access';
}

interface AdminRefreshTokenPayload {
  sub: string;
  token_type: 'admin_refresh';
}

@Injectable()
export class AdminService {
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
    const password_hash = await bcrypt.hash(dto.password, 12);

    const admin = await this.adminRepository.save(
      this.adminRepository.create({
        username,
        password_hash: password_hash,
        store_id: dto.store_id,
      }),
    );

    return {
      success: true,
      message: 'Admin account created successfully',
      data: {
        id: admin.id,
        username: admin.username,
        store_id: admin.store_id,
        store_name: store.name,
        created_at: admin.created_at,
      },
    };
  }

  async login(username_input: string, password: string) {
    const username = this.normalizeUsername(username_input);
    const admin = await this.adminRepository.findOne({ where: { username } });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const store = await this.findAdminStoreForProfile(admin);
    const tokens = this.issueTokens(admin);

    return {
      success: true,
      message: 'Admin login successful',
      data: {
        ...tokens,
        admin: this.formatAdminProfile(admin, store),
      },
    };
  }

  async refresh(refresh_token: string) {
    let payload: AdminRefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync(refresh_token, {
        secret: this.configService.get<string>('ADMIN_JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (payload.token_type !== 'admin_refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const admin = await this.findExistingAdmin(payload.sub);
    await this.findAdminStoreForProfile(admin);

    return {
      success: true,
      data: this.issueTokens(admin),
    };
  }

  async getCurrentAdmin(admin_id: string) {
    const admin = await this.findExistingAdmin(admin_id);
    const store = await this.findAdminStoreForProfile(admin);

    return {
      success: true,
      data: this.formatAdminProfile(admin, store),
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
      store_id: admin.store_id,
      role: admin.role,
      token_type: 'admin_access',
    };
    const refreshPayload: AdminRefreshTokenPayload = {
      sub: admin.id,
      token_type: 'admin_refresh',
    };

    return {
      access_token: this.jwtService.sign(accessPayload, {
        secret: this.configService.get<string>('ADMIN_JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('ADMIN_JWT_ACCESS_EXPIRES_IN') ?? '15m',
      } as JwtSignOptions),
      refresh_token: this.jwtService.sign(refreshPayload, {
        secret: this.configService.get<string>('ADMIN_JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('ADMIN_JWT_REFRESH_EXPIRES_IN') ?? '30d',
      } as JwtSignOptions),
    };
  }

  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  private async findAdminStoreForProfile(admin: Admin): Promise<Store | null> {
    if (admin.role === AdminRole.SUPER_ADMIN && !admin.store_id) {
      return null;
    }

    if (!admin.store_id) {
      throw new UnauthorizedException('Admin is not assigned to a store');
    }

    return this.storesService.findStoreForAdminByStoreId(admin.store_id);
  }

  private formatAdminProfile(admin: Admin, store: Store | null) {
    return {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      store: store ? {
        id: admin.store_id,
        name: store.name,
        emedix_name: store.emedix_name,
        address: store.formatted_address,
        city: store.city,
        phone: store.phone,
        opening_time: store.opening_time,
        closing_time: store.closing_time,
        is_active: store.is_active,
      } : null,
    };
  }
}
