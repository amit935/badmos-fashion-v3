import { describe, it, expect, vi } from 'vitest';
import { usePriceFormatter } from '~/composables/usePriceFormatter';

// Keep the real vue-i18n (the app's i18n plugin needs createI18n)
// and replace only useI18n with a fake that returns the locale
vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useI18n: () => ({ t: () => 'en-IN' }),
  };
});

describe('usePriceFormatter', () => {
  const { formatPrice } = usePriceFormatter();

  it('converts minor units to a formatted currency string', () => {
    expect(formatPrice(49900, 'INR')).toContain('499.00');
  });

  it('defaults to INR when no currency code is given', () => {
    expect(formatPrice(49900)).toContain('499.00');
  });

  it('returns an empty string for missing amounts', () => {
    expect(formatPrice(null, 'INR')).toBe('');
    expect(formatPrice(undefined, 'INR')).toBe('');
    expect(formatPrice('', 'INR')).toBe('');
  });

  it('returns the original value when the amount is not a number', () => {
    expect(formatPrice('abc', 'INR')).toBe('abc');
  });

  it('uses the plain fallback format for an invalid currency code', () => {
    expect(formatPrice(49900, 'AB')).toBe('AB 499.00');
  });
});