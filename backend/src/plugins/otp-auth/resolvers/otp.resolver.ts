import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
    Allow,
    Ctx,
    EventBus,
    Permission,
    RequestContext,
} from '@vendure/core';
import gql from 'graphql-tag';
import { OtpService } from '../services/otp.service';
import { OtpRequestedEvent } from '../events/otp-requested.event';

export const shopApiExtensions = gql`
    extend type Mutation {
        """
        Request a one-time login code to be sent to the given email address.
        Always returns true to avoid leaking whether an email exists.
        """
        requestOtp(email: String!): Boolean!
    }
`;

@Resolver()
export class OtpResolver {
    constructor(
        private otpService: OtpService,
        private eventBus: EventBus,
    ) {}

    @Mutation()
    @Allow(Permission.Public)
    async requestOtp(
        @Ctx() ctx: RequestContext,
        @Args('email') email: string,
    ): Promise<boolean> {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Generate a 6-digit code
        const code = this.otpService.generateCode();

        // 2. Save to database (also invalidates old codes)
        await this.otpService.createOtp(ctx, normalizedEmail, code);

        // 3. Publish event so the EmailPlugin sends the code
        this.eventBus.publish(new OtpRequestedEvent(ctx, normalizedEmail, code));

        // Always return true to avoid email enumeration
        return true;
    }
}
