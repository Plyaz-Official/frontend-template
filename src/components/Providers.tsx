'use client';
import type { Messages } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import type { SupportedLanguage } from '@plyaz/types';
import { timeZone as configuredTimeZone } from '@plyaz/translations';
import config from '@plyaz/translations/config';
import { TranslationProvider } from '@plyaz/translations/frontend/providers';
import { PlyazProvider } from '@plyaz/core/frontend';
import { useRootStore } from '@plyaz/store';

import { frontendConfig } from '@/config/plyaz.frontend';
import { DevtoolsProvider } from './DevtoolsProvider';

// Fallback to UTC if timeZone not configured in @plyaz/translations
const timeZone = configuredTimeZone || 'UTC';

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
      <TranslationProvider config={{ ...config }}>
        <PlyazProvider
          store={useRootStore}
          config={frontendConfig}
          loading={<div>Loading Plyaz services...</div>}
          error={err => <div>Error: {err.toString()}</div>}
          onReady={services => services.getServiceKeys()}
          onError={err => err}
        >
          <DevtoolsProvider>{children}</DevtoolsProvider>
        </PlyazProvider>
      </TranslationProvider>
    </NextIntlClientProvider>
  );
}
