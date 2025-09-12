import type { IntlError } from 'next-intl';
import { IntlErrorCode } from 'next-intl';

export function getMessageFallback({
  namespace,
  key,
  error,
}: {
  namespace?: string;
  key: string;
  error: IntlError;
}) {
  const path = [namespace, key].filter(part => part != null).join('.');

  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    return path + ' is not yet translated';
  } else {
    return 'Dear developer, please fix this message: ' + path;
  }
}
