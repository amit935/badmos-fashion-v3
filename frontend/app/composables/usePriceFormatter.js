import { useI18n } from 'vue-i18n';

export function usePriceFormatter() {
  const { t } = useI18n();

  // amount: Vendure minor units (4999 = 49.99). currencyCode: ISO code from Vendure.
  const formatPrice = (amount, currencyCode) => {
    if (amount === undefined || amount === null || amount === '') return '';
    const minor = Number(amount);
    if (Number.isNaN(minor)) return String(amount);

    try {
      return new Intl.NumberFormat(t('locale.currency'), {
        style: 'currency',
        currency: currencyCode || 'INR',
      }).format(minor / 100);
    } catch {
      return `${currencyCode || ''} ${(minor / 100).toFixed(2)}`.trim();
    }
  };

  return { formatPrice };
}