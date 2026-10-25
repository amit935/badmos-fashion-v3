import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    NativeAuthenticationStrategy,
    VendureConfig,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { AssetServerPlugin, configureS3AssetStorage } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';
import { OtpAuthPlugin } from './plugins/otp-auth/otp-auth.plugin';
import { OtpAuthenticationStrategy } from './plugins/otp-auth/otp-strategy';
import { otpRequestedEmailHandler } from './plugins/otp-auth/services/email-handler';

const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || +process.env.VENDURE_SERVER_PORT || 3000;
const isR2Enabled = !!process.env.CF_R2_ACCESS_KEY_ID;

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        trustProxy: IS_DEV ? false : 1,
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
          secret: process.env.COOKIE_SECRET,
        },
        shopAuthenticationStrategy: [
            new NativeAuthenticationStrategy(),
            new OtpAuthenticationStrategy(),
        ],
    },
    dbConnectionOptions: {
        type: 'postgres',
        synchronize: false,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        database: process.env.DB_NAME,
        schema: process.env.DB_SCHEMA,
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    customFields: {},
    plugins: [
        GraphiqlPlugin.init(),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            assetUrlPrefix: isR2Enabled
                ? (process.env.CF_R2_PUBLIC_URL ? `${process.env.CF_R2_PUBLIC_URL.replace(/\/$/, '')}/` : undefined)
                : (IS_DEV ? undefined : 'https://www.my-shop.com/assets/'),
            storageStrategyFactory: isR2Enabled
                ? configureS3AssetStorage({
                    bucket: process.env.CF_R2_BUCKET || '',
                    credentials: {
                        accessKeyId: process.env.CF_R2_ACCESS_KEY_ID || '',
                        secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY || '',
                    },
                    nativeS3Configuration: {
                        endpoint: process.env.CF_R2_ENDPOINT,
                        region: process.env.CF_R2_REGION || 'auto',
                        forcePathStyle: true,
                    },
                })
                : undefined,
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: [...defaultEmailHandlers, otpRequestedEmailHandler],
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://localhost:8080/verify',
                passwordResetUrl: 'http://localhost:8080/password-reset',
                changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change'
            },
        }),
        DashboardPlugin.init({
            route: 'dashboard',
            appDir: IS_DEV
                ? path.join(__dirname, '../dist/dashboard')
                : path.join(__dirname, 'dashboard'),
        }),
        OtpAuthPlugin.init(),
    ],
};
