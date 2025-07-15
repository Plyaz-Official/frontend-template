import { type Metadata } from 'next';
import React from 'react';
import '../../global.css';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';

import Providers from 'src/components/Providers';
import { routing } from 'src/i18n/routing';

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
    <html lang={locale}>
      <body>
        <Providers messages={messages} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
