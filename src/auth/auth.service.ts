import { Injectable, InternalServerErrorException, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as twilio from 'twilio';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private twilioClient: twilio.Twilio;

    constructor(
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
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

        let user = await this.usersService.findByMobile(mobile_no);
        if (!user) {
            user = await this.usersService.create({ mobile_no });
        }

        user.otpHash = otpHash;
        user.expiresAt = expiresAt;
        user.attemptCount = 0;
        await this.usersService.save(user);

        try {
            await this.twilioClient.messages.create({
                body: `Your Emedix Jiffy OTP is ${otp}. It will expire in 5 minutes.`,
                from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
                to: `+91${mobile_no}`,
            });
            return { success: true, message: 'OTP sent successfully' };
        } catch (error) {
            this.logger.error(`Failed to send OTP to ${mobile_no}: ${error.message}`);
            throw new InternalServerErrorException('Error sending SMS, please try again.');
        }
    }

    async verifyOtp(mobile_no: string, otp: string) {
        const user = await this.usersService.findByMobile(mobile_no);

        if (!user || !user.otpHash || !user.expiresAt) {
            throw new BadRequestException('No active OTP session found.');
        }

        if (new Date() > user.expiresAt) {
            throw new BadRequestException('OTP has expired.');
        }
        const isMatch = await bcrypt.compare(otp, user.otpHash);
        if (!isMatch) {
            user.attemptCount += 1;
            await this.usersService.save(user);
            throw new UnauthorizedException('Invalid OTP.');
        }

        user.otpHash = null;
        user.expiresAt = null;
        user.attemptCount = 0;
        await this.usersService.save(user);

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
        const user = await this.usersService.findByMobile(mobile_no);
        if (!user) {
            throw new BadRequestException('User not found.');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

        user.otpHash = otpHash;
        user.expiresAt = expiresAt;
        user.attemptCount = 0;
        await this.usersService.save(user);

        try {
            await this.twilioClient.messages.create({
                body: `Your Emedix Jiffy OTP is ${otp}. It will expire in 5 minutes.`,
                from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
                to: `+91${mobile_no}`,
            });
            return { success: true, message: 'OTP resent successfully' };
        } catch (error) {
            this.logger.error(`Resend failed for ${mobile_no}: ${error.message}`);
            throw new InternalServerErrorException('Error sending SMS.');
        }
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
