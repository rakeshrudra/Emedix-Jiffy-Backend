import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoresService } from '../stores/stores.service';
import { Store } from '../stores/entities/store.entity';
import { AdminSignupDto } from './dto/admin-signup.dto';
import { Admin } from './entities/admin.entity';
import { AdminRole } from './enums/admin-role.enum';
import { SsoTokenPayload } from '../common/guards/sso-auth.guard';

export interface AuthenticatedAdmin {
  sub: string;
  identity_id: string;
  mobile_no: string;
  username: string;
  store_id: string | null;
  role: AdminRole;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly storesService: StoresService,
  ) {}

  async signup(sso: SsoTokenPayload, dto: AdminSignupDto) {
    const existing = await this.adminRepository.findOne({
      where: [{ identity_id: sso.sub }, { mobile_no: sso.mobile_no }],
    });
    if (existing) {
      throw new ConflictException('Admin is already signed up');
    }

    const role = sso.role as AdminRole;

    if (!this.isJiffyEligibleRole(role)) {
      throw new ForbiddenException(
        'This role does not have access to the Jiffy Admin Panel',
      );
    }

    const isStoreExempt = this.isStoreExemptRole(role);

    if (!isStoreExempt && !dto.store_id) {
      throw new BadRequestException('store_id is required for this role');
    }

    const store = isStoreExempt
      ? null
      : await this.storesService.findStoreForAdminByStoreId(dto.store_id!);

    const admin = await this.adminRepository.save(
      this.adminRepository.create({
        identity_id: sso.sub,
        mobile_no: sso.mobile_no,
        username: sso.username,
        store_id: isStoreExempt ? null : dto.store_id,
        role,
      }),
    );

    return {
      success: true,
      message: 'Admin signed up successfully',
      data: {
        id: admin.id,
        identity_id: admin.identity_id,
        username: admin.username,
        role: admin.role,
        store_id: admin.store_id,
        store_name: store?.name ?? null,
        created_at: admin.created_at,
      },
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

  async findByIdentityId(identity_id: string): Promise<Admin | null> {
    return this.adminRepository.findOneBy({ identity_id });
  }

  async acceptTerms(user: AuthenticatedAdmin) {
    if (!user.store_id) {
      throw new BadRequestException('Admin is not assigned to a store');
    }

    await this.storesService.acceptTerms(user.store_id);

    return {
      success: true,
      data: { terms_accepted: true },
    };
  }

  private async findExistingAdmin(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new UnauthorizedException('Admin no longer exists');
    }

    return admin;
  }

  private isStoreExemptRole(role: AdminRole): boolean {
    return (
      role === AdminRole.EMEDIX_SUPERADMIN ||
      role === AdminRole.EMEDIX_ADMIN ||
      role === AdminRole.EMEDIX_OP_ADMIN
    );
  }

  private isJiffyEligibleRole(role: AdminRole): boolean {
    return this.isStoreExemptRole(role) || this.isStoreScopedRole(role);
  }

  private isStoreScopedRole(role: AdminRole): boolean {
    return (
      role === AdminRole.STORE_OWNER ||
      role === AdminRole.STORE_ADMIN ||
      role === AdminRole.STORE_STAFF
    );
  }

  private async findAdminStoreForProfile(admin: Admin): Promise<Store | null> {
    if (this.isStoreExemptRole(admin.role) && !admin.store_id) {
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
      mobile_no: admin.mobile_no,
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
        terms_accepted: store.terms_accepted,
      } : null,
    };
  }
}
