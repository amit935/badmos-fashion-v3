import { Injectable } from '@nestjs/common';
import {
    Logger,
    RequestContext,
    TransactionalConnection,
} from '@vendure/core';
import { IsNull, MoreThan } from 'typeorm';
import { OneTimeCode } from '../entities/otp.entity';

const loggerCtx = 'OtpAuthPlugin';

/**
 * OTP expiry duration in minutes.
 */
const OTP_EXPIRY_MINUTES = 10;

@Injectable()
export class OtpService {
    constructor(
        private connection: TransactionalConnection,
    ) {}

    /**
     * Generates a 6-digit OTP code string.
     */
    generateCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Creates a new OTP record for the given email.
     * Invalidates any previously unused codes for the same email.
     */
    async createOtp(ctx: RequestContext, email: string, code: string): Promise<OneTimeCode> {
        const repo = this.connection.getRepository(ctx, OneTimeCode);

        // Mark all existing unused codes for this email as used
        await repo.update(
            { email, isUsed: false },
            { isUsed: true },
        );

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

        const otp = new OneTimeCode({
            email,
            code,
            expiresAt,
            isUsed: false,
        });

        const saved = await repo.save(otp);
        Logger.info(`OTP created for ${email}, expires at ${expiresAt.toISOString()}`, loggerCtx);
        return saved;
    }

    /**
     * Validates the OTP code for the given email.
     * Returns `true` if the code is valid and marks it as used.
     * Returns `false` if invalid or expired.
     */
    async validateOtp(ctx: RequestContext, email: string, code: string): Promise<boolean> {
        const repo = this.connection.getRepository(ctx, OneTimeCode);

        const otp = await repo.findOne({
            where: {
                email,
                code,
                isUsed: false,
            },
        });

        if (!otp) {
            Logger.warn(`OTP validation failed for ${email}: code not found or already used`, loggerCtx);
            return false;
        }

        // Check expiry
        if (new Date() > otp.expiresAt) {
            Logger.warn(`OTP validation failed for ${email}: code expired`, loggerCtx);
            // Mark as used so it can't be retried
            await repo.update(otp.id, { isUsed: true });
            return false;
        }

        // Mark as used
        await repo.update(otp.id, { isUsed: true });
        Logger.info(`OTP validated successfully for ${email}`, loggerCtx);
        return true;
    }
}
