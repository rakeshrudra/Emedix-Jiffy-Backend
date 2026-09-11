import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppPlatform, AppVersion } from './entities/app-version.entity';
import { UpdateAppVersionDto } from './dto/update-app-version.dto';

@Injectable()
export class AppVersionService {
  constructor(
    @InjectRepository(AppVersion)
    private readonly appVersionRepository: Repository<AppVersion>,
  ) {}

  async getAndroid() {
    const config = await this.appVersionRepository.findOneBy({
      platform: AppPlatform.ANDROID,
    });
    if (!config) {
      throw new NotFoundException('No Android version config found');
    }

    return {
      platform: config.platform,
      min_supported_version: config.min_supported_version,
      latest_version: config.latest_version,
      store_url: config.store_url,
      release_notes: config.release_notes,
    };
  }

  async updateAndroid(dto: UpdateAppVersionDto) {
    const config = await this.appVersionRepository.findOneBy({
      platform: AppPlatform.ANDROID,
    });
    if (!config) {
      throw new NotFoundException('No Android version config found');
    }

    Object.assign(config, dto);
    await this.appVersionRepository.save(config);

    return this.getAndroid();
  }
}
