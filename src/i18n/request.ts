import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';

export default getRequestConfig(async ({requestLocale,}) => {
  const requested = await requestLocale;
  const locale = hasLocale(['en', 'es', 'fr', 'it', 'pt-PT', 'pt-BR'], requested)
    ? requested
    : 'en';
  const messages = {
    ...(await import(`./../../node_modules/@plyaz/translations/src/locales/${locale}/common.json`)).default,
    ...(await import(`./../../node_modules/@plyaz/translations/src/locales/${locale}/components.json`)).default,
    ...(await import(`./../../node_modules/@plyaz/translations/src/locales/${locale}/errors.json`)).default,
  }
  return {
    locale,
    messages
  };
});