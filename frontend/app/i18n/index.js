import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    auth: {
      login: {
        title: 'Officially, Badmos!',
        altTitle: 'Sign In',
        caption: 'Login with your official Badmos ID.',
        email: 'Email',
        submit: 'Send Secret Code',
        otpCaption: 'Check your email {email} for the Secret Code.',
        otpLabel: 'Secret Code',
        otpSubmit: 'Check In',
        otpWarningLength: 'Secret Code must be exactly 6 digits.',
      },
      register: {
        altTitle: 'Register',
      },
    },
    guest: {
      profileDropdown: {
        title: 'Welcome to Badmos',
      },
    },
    footer: {
      copyright: '© 2026 Badmos Fashion. All rights reserved.',
    },
  },
};

export default createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
});
