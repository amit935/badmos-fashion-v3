import { EmailEventListener } from '@vendure/email-plugin';
import { OtpRequestedEvent } from '../events/otp-requested.event';

/**
 * Email handler that sends OTP codes to customers.
 * 
 * Requires a corresponding email template at:
 *   static/email/templates/otp-requested/body.hbs
 */
export const otpRequestedEmailHandler = new EmailEventListener('otp-requested')
    .on(OtpRequestedEvent)
    .setRecipient(event => event.emailAddress)
    .setFrom('{{ fromAddress }}')
    .setSubject('Your login code for Badmos Fashion')
    .setTemplateVars(event => ({
        otpCode: event.otpCode,
        email: event.emailAddress,
    }));
