'use client';
import type { Messages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import type { SupportedLanguage } from '@plyaz/types';

import TranslationProviderClient from './TranslationProviderClient';

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
      <TranslationProviderClient>{children}</TranslationProviderClient>
    </NextIntlClientProvider>
  );
}
