'use client';
import type { Messages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import type { SupportedLanguage } from '@plyaz/types';
import { TranslationProvider } from '@plyaz/translations/frontend';
import config from '@plyaz/translations/config';

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
    <NextIntlClientProvider messages={messages} locale={locale}>
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
