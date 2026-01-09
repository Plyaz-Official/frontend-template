import { getRequestConfig } from 'next-intl/server';
import type { Messages } from 'next-intl';
import { hasLocale } from 'next-intl';
import {
  getSupportedLanguages,
  timeZone as configuredTimeZone,
  resources,
} from '@plyaz/translations';
import deepmerge from 'deepmerge';

import { getMessageFallback } from './fallback';

// Fallback to UTC if timeZone not configured in @plyaz/translations
const timeZone = configuredTimeZone || 'UTC';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(getSupportedLanguages(), requested) ? requested : 'en';
  const userMessages = (await import(`../../messages/${locale}.json`)).default;
  const defaultMessages = (await import(`../../messages/en.json`)).default;
  const messages = locale === 'en' ? defaultMessages : deepmerge(defaultMessages, userMessages);
  const messagesWithResources = deepmerge<Messages>(
    resources[locale] as Messages,
    messages as Messages
  );
  return {
    getMessageFallback,
    locale,
    timeZone,
    messages: messagesWithResources,
  };
});
