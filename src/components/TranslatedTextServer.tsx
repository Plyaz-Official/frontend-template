import React from 'react';
import { useTranslations } from 'next-intl';
import type { AppTranslationKeys } from '@plyaz/translations';
import type { TranslationOptions } from '@plyaz/types/translations';
import type { TextProps } from '@plyaz/ui';
import { Text } from '@plyaz/ui';

interface TranslatedTextProps extends Omit<TextProps, 'children'> {
  translationKey: AppTranslationKeys;
  translationOptions?: TranslationOptions;
}

/**
 * TranslatedText component for rendering translated text content.
 *
 * This component renders translated text using the Text component from @plyaz/ui.
 * It's useful for simple text translations without HTML markup.
 *
 * @param props - Component props
 * @param props.translationKey - The translation key to look up
 * @param props.translationOptions - Optional interpolation values for the translation
 * @param props.textProps - Additional Text component props
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TranslatedText translationKey="welcome_message" />
 *
 * // With interpolation
 * <TranslatedText
 *   translationKey="greeting"
 *   translationOptions={{ args: { name: "John" } }}
 * />
 *
 * // With Text component props
 * <TranslatedText
 *   translationKey="error_message"
 *   color="error"
 *   weight="semibold"
 * />
 * ```
 *
 * @returns A Text component containing the translated content
 */
const TranslatedText: React.FC<TranslatedTextProps> = ({
  translationKey,
  translationOptions,
  ...textProps
}) => {
  const t = useTranslations();
  const translated = t(
    translationKey,
    translationOptions?.args as Record<string, string | number | Date>
  );
  return <Text {...textProps}>{translated}</Text>;
};

export default TranslatedText;
