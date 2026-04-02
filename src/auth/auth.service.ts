import { Injectable, InternalServerErrorException, Logger, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as twilio from 'twilio';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private twilioClient: twilio.Twilio;

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        this.twilioClient = twilio.default(
            this.configService.get<string>('TWILIO_ACCOUNT_SID'),
            this.configService.get<string>('TWILIO_AUTH_TOKEN'),
        )
    }

    async getOtp(mobile_no: string) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);

        // Store in Redis instead of MySQL - with 5 minute expiry
        try {
            await this.redisClient.set(`otp:${mobile_no}`, otpHash, 'EX', 300);

            // Send SMS via Twilio
            await this.twilioClient.messages.create({
                body: `Your Emedix Jiffy OTP is ${otp}. It will expire in 5 minutes.`,
                from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
                to: `+91${mobile_no}`,
            });

            return { success: true, message: 'OTP sent successfully' };
        } catch (error) {
            this.logger.error(`Failed to handle OTP for ${mobile_no}: ${error.message}`);
            throw new InternalServerErrorException('Mobile number is Invalid or service unavailable');
        }
    }

    async verifyOtp(mobile_no: string, otp: string) {
        // 1. Check Redis for OTP
        const cachedHash = await this.redisClient.get(`otp:${mobile_no}`);

        if (!cachedHash) {
            throw new BadRequestException('OTP has expired or never requested.');
        }

        // 2. Verify OTP Match
        const isMatch = await bcrypt.compare(otp, cachedHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid OTP.');
        }

        // 3. SUCCESS - Now prove real identity and create/fetch user in DB
        let user = await this.usersService.findByMobile(mobile_no);
        if (!user) {
            user = await this.usersService.create({ mobile_no });
        }

        // 4. Cleanup Redis
        await this.redisClient.del(`otp:${mobile_no}`);

        const payload = { sub: user.id, mobile_no: user.mobile_no };
        return {
            success: true,
            message: 'OTP verified',
            data: {
                accessToken: this.jwtService.sign(payload),
                user: {
                    id: user.id,
                    mobile_no: user.mobile_no,
                }
            }
        }
    }

    async resendOtp(mobile_no: string) {
        // Just call getOtp - Redis will naturally overwrite the existing key
        return this.getOtp(mobile_no);
    }

    async getProfile(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return {
            success: true,
            message: 'User profile fetched successfully',
            data: {
                id: user.id,
                mobile_no: user.mobile_no,
                created_at: user.createdAt,
            }
        }
    }
}
