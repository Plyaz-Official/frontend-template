'use client';

import { PlyazDevtools, type PlyazInstance } from '@plyaz/devtools-extension';
import { usePlyaz } from '@plyaz/core/frontend';
import { useLocale, useMessages } from 'next-intl';

interface DevtoolsProviderProps {
  children: React.ReactNode;
}

export function DevtoolsProvider({ children }: DevtoolsProviderProps) {
  const plyaz = usePlyaz();
  const locale = useLocale();
  const messages = useMessages();

  return (
    <>
      {children}
      <PlyazDevtools
        plyaz={plyaz as unknown as PlyazInstance}
        intl={{ locale, messages }}
        config={{
          enabled: process.env.NODE_ENV === 'development',
          position: 'bottom',
        }}
      />
    </>
  );
}
