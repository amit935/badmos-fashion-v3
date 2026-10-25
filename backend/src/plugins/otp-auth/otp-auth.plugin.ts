import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import { OneTimeCode } from './entities/otp.entity';
import { OtpService } from './services/otp.service';
import { OtpResolver, shopApiExtensions } from './resolvers/otp.resolver';

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [OneTimeCode],
    providers: [OtpService],
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [OtpResolver],
    },
    compatibility: '^3.0.0',
})
export class OtpAuthPlugin {
    static init(): Type<OtpAuthPlugin> {
        return OtpAuthPlugin;
    }
}
