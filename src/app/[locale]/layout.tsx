import { type Metadata } from 'next';
import React from 'react';
import '@/global.css';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { routing } from 'src/i18n/routing';
import Providers from '@/components/Providers';
import { StreamDevTools } from '@/components/StreamDevTools';

export const metadata: Metadata = {
  title: 'Plyaz Template Editor',
  description: 'Local backoffice for managing storage and notification templates',
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
        <Providers messages={messages} locale={locale}>
          {children}
          <StreamDevTools />
        </Providers>
      </body>
    </html>
  );
}
