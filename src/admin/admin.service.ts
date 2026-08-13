import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoresService } from '../stores/stores.service';
import { Store } from '../stores/entities/store.entity';
import { Admin } from './entities/admin.entity';
import { AdminRole } from './enums/admin-role.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly storesService: StoresService,
  ) {}

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

  private async findExistingAdmin(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new UnauthorizedException('Admin no longer exists');
    }

    return admin;
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
