import {
    AuthenticationStrategy,
    ExternalAuthenticationService,
    Injector,
    RequestContext,
    User,
} from '@vendure/core';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import { OtpService } from './services/otp.service';

export interface OtpAuthInput {
    email: string;
    code: string;
}

/**
 * A custom AuthenticationStrategy that lets customers log in
 * by providing their email + a one-time code that was sent to them.
 *
 * Usage from the storefront:
 * ```graphql
 * mutation {
 *   authenticate(input: { otp: { email: "...", code: "123456" } }) {
 *     ... on CurrentUser { id identifier }
 *     ... on ErrorResult { errorCode message }
 *   }
 * }
 * ```
 */
export class OtpAuthenticationStrategy implements AuthenticationStrategy<OtpAuthInput> {
    readonly name = 'otp';

    private externalAuthService: ExternalAuthenticationService;
    private otpService: OtpService;

    init(injector: Injector) {
        this.externalAuthService = injector.get(ExternalAuthenticationService);
        this.otpService = injector.get(OtpService);
    }

    defineInputType(): DocumentNode {
        return gql`
            input OtpAuthInput {
                email: String!
                code: String!
            }
        `;
    }

    async authenticate(ctx: RequestContext, data: OtpAuthInput): Promise<User | false | string> {
        const email = data.email.trim().toLowerCase();

        // 1. Validate the OTP
        const isValid = await this.otpService.validateOtp(ctx, email, data.code);
        if (!isValid) {
            return 'Invalid or expired OTP code';
        }

        // 2. Look up an existing customer user
        const existingUser = await this.externalAuthService.findCustomerUser(
            ctx,
            this.name,
            email,
        );

        if (existingUser) {
            return existingUser;
        }

        // 3. No existing user — create a new customer + user
        //    Since the OTP proves ownership of the email, we set verified: true
        return this.externalAuthService.createCustomerAndUser(ctx, {
            strategy: this.name,
            externalIdentifier: email,
            emailAddress: email,
            firstName: '',
            lastName: '',
            verified: true,
        });
    }
}
