import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { resources } from '@plyaz/translations';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(['en', 'es', 'fr', 'it', 'pt-PT', 'pt-BR'], requested)
    ? requested
    : 'en';

  return {
    locale,
    messages: resources[locale],
  };
});
