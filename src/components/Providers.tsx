'use client';
import type { Messages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import type { SupportedLanguage } from '@plyaz/types';
import { TranslationProvider } from '@plyaz/translations/frontend/providers';
import config from '@plyaz/translations/config';
import { timeZone } from '@plyaz/translations';

export default function Providers({
  children,
  messages,
  locale,
}: {
  children: React.ReactNode;
  messages: Messages;
  locale: SupportedLanguage;
}) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone={timeZone}>
      <TranslationProvider
        config={{
          ...config,
        }}
      >
        {children}
      </TranslationProvider>
    </NextIntlClientProvider>
  );
}
