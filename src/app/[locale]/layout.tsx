import { type Metadata } from 'next';
import React from 'react';
import '../../global.css';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';

import { routing } from 'src/i18n/routing';
import TranslationProviderClient from 'src/components/TranslationProviderClient';

export const metadata: Metadata = {
  title: 'Plyaz Fe Template',
  description: 'Plyaz Frontend Template',
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>): Promise<React.ReactElement> {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <TranslationProviderClient>
            {children}
          </TranslationProviderClient>
        </NextIntlClientProvider>
      </body>
    </html>
    );
}
