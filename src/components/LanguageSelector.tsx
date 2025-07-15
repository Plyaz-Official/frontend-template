'use client';

import { LanguageSelector } from '@plyaz/ui';
import type { NamespaceKeys } from 'next-intl';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useTransition } from 'react';

import { useRouter, usePathname } from 'src/i18n/navigation';
import { routing } from 'src/i18n/routing';

/**
 * LanguageSelector component for switching between available locales.
 *
 * This component provides a dropdown interface for users to change the application's
 * language. It automatically handles locale switching with proper routing and
 * maintains the current page context during language changes.
 *
 * Features:
 * - Displays current locale as selected value
 * - Shows all available locales from routing configuration
 * - Handles locale switching with React transitions
 * - Disables interaction during locale change to prevent conflicts
 * - Uses translated labels for locale names
 *
 * @example
 * ```tsx
 * <LanguageSelector />
 * ```
 *
 * @returns A Select component with locale options
 */
export default function LanguageSelectorWrapper() {
  const t = useTranslations('components.LanguageSelector');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextLocale: string) => {
    startTransition(() => {
      router.replace(
        // @ts-expect-error - params is not defined in the type
        { pathname, params },
        { locale: nextLocale }
      );
    });
  };

  return (
    <LanguageSelector
      locale={locale}
      locales={routing.locales as string[]}
      onChange={handleChange}
      getLabel={(loc: string) =>
        t(`locale.${loc}` as NamespaceKeys<typeof t, 'components.LanguageSelector'>)
      }
      disabled={isPending}
    />
  );
}
