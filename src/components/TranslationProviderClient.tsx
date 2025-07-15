'use client';

import { TranslationProvider } from '@plyaz/translations/frontend';
import config from '@plyaz/translations/config';

/**
 * TranslationProviderClient component for client-side translation context.
 *
 * This component wraps the application with the translation provider
 * for client-side components. It uses the configuration from @plyaz/translations
 * to set up the translation context.
 *
 * @param props - Component props
 * @param props.children - React children to be wrapped with translation context
 *
 * @example
 * ```tsx
 * // In your app layout
 * <TranslationProviderClient>
 *   <YourApp />
 * </TranslationProviderClient>
 * ```
 *
 * @returns A TranslationProvider wrapping the children
 */
export default function TranslationProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <TranslationProvider
      config={{
        ...config,
      }}
    >
      {children}
    </TranslationProvider>
  );
}
