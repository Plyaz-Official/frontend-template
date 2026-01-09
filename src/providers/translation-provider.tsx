'use client';
import type { Messages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import type { SupportedLanguage } from '@plyaz/types';
import { timeZone as configuredTimeZone } from '@plyaz/translations';
import config from '@plyaz/translations/config';
import { TranslationProvider as Provider } from '@plyaz/translations/frontend/providers';

import { getMessageFallback } from '../i18n/fallback';

// Fallback to UTC if timeZone not configured in @plyaz/translations
const timeZone = configuredTimeZone || 'UTC';

export function TranslationProvider({
  children,
  messages,
  locale,
}: {
  children: React.ReactNode;
  messages: Messages;
  locale: SupportedLanguage;
}) {
  return (
    <NextIntlClientProvider
      timeZone={timeZone}
      messages={messages}
      getMessageFallback={getMessageFallback}
      locale={locale}
    >
      <Provider
        config={{
          ...config,
        }}
      >
        {children}
      </Provider>
    </NextIntlClientProvider>
  );
}
