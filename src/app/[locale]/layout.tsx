import { type Metadata } from 'next';
import React from 'react';
import '@/global.css';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { routing } from 'src/i18n/routing';
import { TranslationProvider } from '@/providers/translation-provider';

export const metadata: Metadata = {
  title: 'Plyaz Fe Template',
  description: 'Plyaz Frontend Template',
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>): Promise<React.ReactElement> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html lang={'es'}>
      <body>
        <TranslationProvider messages={messages} locale={locale}>
          {children}
        </TranslationProvider>
      </body>
    </html>
  );
}
