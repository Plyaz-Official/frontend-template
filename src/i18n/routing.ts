import { defineRouting } from 'next-intl/routing';
import { getSupportedLanguages } from '@plyaz/translations';

export const routing = defineRouting({
  locales: getSupportedLanguages(),
  defaultLocale: 'en',
});
