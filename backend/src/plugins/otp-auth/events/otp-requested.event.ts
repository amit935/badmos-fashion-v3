import { VendureEvent, RequestContext } from '@vendure/core';

/**
 * Emitted when a customer requests an OTP code.
 * The EmailPlugin listens for this event to send the code via email.
 */
export class OtpRequestedEvent extends VendureEvent {
    constructor(
        public ctx: RequestContext,
        public emailAddress: string,
        public otpCode: string,
    ) {
        super();
    }
}
