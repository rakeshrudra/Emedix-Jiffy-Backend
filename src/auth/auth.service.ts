import { Injectable, InternalServerErrorException, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as twilio from 'twilio';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private twilioClient: twilio.Twilio;

    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        this.twilioClient = twilio.default(
            this.configService.get<string>('TWILIO_ACCOUNT_SID'),
            this.configService.get<string>('TWILIO_AUTH_TOKEN'),
        )
    }

    async getOtp(mobile_no: string) {
        // 1. Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 mins expiry

        // 2. Fetch or Create user
        let user = await this.userRepository.findOne({ where: { mobile_no } });
        if (!user) {
            user = this.userRepository.create({ mobile_no });
        }

        // 3. Update user with hashed OTP
        user.otpHash = otpHash;
        user.expiresAt = expiresAt;
        user.attemptCount = 0;
        await this.userRepository.save(user);

        // 4. Send OTP via Twilio
        try {
            await this.twilioClient.messages.create({
                body: `Your Emedix Jiffy OTP is ${otp}. It will expire in 5 minutes.`,
                from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
                to: `+91${mobile_no}`, // Assuming Indian numbers, prefix can be configurable
            });
            return { success: true, message: 'OTP sent successfully' };
        } catch (error) {
            this.logger.error(`Failed to send OTP to ${mobile_no}: ${error.message}`);
            throw new InternalServerErrorException('Error sending SMS, please try again.');
        }
    }

    async verifyOtp(mobile_no: string, otp: string) {
        const user = await this.userRepository.findOne({ where: { mobile_no } });

        if (!user || !user.otpHash || !user.expiresAt) {
            throw new BadRequestException('No active OTP session found.');
        }

        // Check expiry
        if (new Date() > user.expiresAt) {
            throw new BadRequestException('OTP has expired.');
        }

        // Verify Hash
        const isMatch = await bcrypt.compare(otp, user.otpHash);
        if (!isMatch) {
            user.attemptCount += 1;
            await this.userRepository.save(user);
            throw new UnauthorizedException('Invalid OTP.');
        }

        // Success - Cleanup and Generate Token
        user.otpHash = "";
        user.expiresAt = new Date();
        user.attemptCount = 0;
        await this.userRepository.save(user);

        const payload = { sub: user.id, mobile_no: user.mobile_no };
        return {
            success: true,
            message: 'OTP verified',
            data: {
                accessToken: this.jwtService.sign(payload),
                user: {
                    id: user.id,
                    mobile_no: user.mobile_no,
                },
            },
        }
    }
}
