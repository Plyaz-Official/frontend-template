
import type {routing} from 'src/i18n/routing';

import type errors from './node_modules/@plyaz/translations/src/locales/en/errors.json';
import type common from './node_modules/@plyaz/translations/src/locales/en/common.json';
import type components from './node_modules/@plyaz/translations/src/locales/en/components.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: {
      errors: typeof errors;
      common: typeof common;
      components: typeof components;
    };
  }
}