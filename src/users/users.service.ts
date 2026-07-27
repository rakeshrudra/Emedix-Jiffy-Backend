import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByMobile(mobile_no: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { mobile_no } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async updateProfile(user_id: string, fields: Partial<Pick<User, 'name' | 'firebase_uid'>>): Promise<User> {
    await this.userRepository.update(user_id, fields);
    return this.userRepository.findOne({ where: { id: user_id } });
  }

  async updateFcmToken(user_id: string, fcm_token: string): Promise<void> {
    await this.userRepository.update(user_id, { fcm_token: fcm_token });
  }

  async clearFcmToken(user_id: string): Promise<void> {
    await this.userRepository.update(user_id, { fcm_token: null });
  }
}
