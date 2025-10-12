import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { getSupportedLanguages, timeZone, resources } from '@plyaz/translations';
import deepmerge from 'deepmerge';

import { getMessageFallback } from './fallback';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(getSupportedLanguages(), requested) ? requested : 'en';
  const userMessages = (await import(`../../messages/${locale}.json`)).default;
  const defaultMessages = (await import(`../../messages/en.json`)).default;
  const messages = locale === 'en' ? defaultMessages : deepmerge(defaultMessages, userMessages);
  const messagesWithResources = deepmerge(resources[locale], messages);
  return {
    getMessageFallback,
    locale,
    timeZone,
    messages: messagesWithResources,
  };
});
