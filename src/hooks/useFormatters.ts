import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { LOCALE_MAP, SupportedLanguage } from '@/i18n';

export function useFormatters() {
  const { i18n } = useTranslation();

  const locale = LOCALE_MAP[i18n.language as SupportedLanguage] || 'es-ES';

  const formatDate = useCallback(
    (dateString: string, options?: Intl.DateTimeFormatOptions) => {
      const defaultOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      };
      return new Date(dateString).toLocaleDateString(locale, options || defaultOptions);
    },
    [locale]
  );

  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(locale, options).format(num);
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(amount);
    },
    [locale]
  );

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return { formatDate, formatNumber, formatCurrency, formatDuration, locale };
}
