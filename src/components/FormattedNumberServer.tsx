import React from 'react';
import { formatNumber } from '@plyaz/translations';
import type { TextProps } from '@plyaz/ui';
import { Text } from '@plyaz/ui';

interface FormattedNumberServerProps extends Omit<TextProps, 'children'> {
  value: number;
  formatOptions?: Intl.NumberFormatOptions;
  locale?: string;
}

/**
 * FormattedNumberServer component for server-side number formatting.
 * 
 * Renders a number value with proper internationalization formatting on the server.
 * Uses the server-side formatting utilities from @plyaz/translations.
 * This component is optimized for server-side rendering and static generation.
 * 
 * @param props - Component props
 * @param props.value - The number to format
 * @param props.formatOptions - Optional Intl.NumberFormatOptions for custom formatting
 * @param props.locale - Optional locale override (defaults to current locale)
 * @param props.textProps - Additional Text component props
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <FormattedNumberServer value={1234.56} />
 * 
 * // Currency formatting
 * <FormattedNumberServer 
 *   value={1234.56} 
 *   formatOptions={{ 
 *     style: 'currency', 
 *     currency: 'EUR' 
 *   }} 
 * />
 * 
 * // Scientific notation
 * <FormattedNumberServer 
 *   value={1234567} 
 *   formatOptions={{ 
 *     notation: 'scientific' 
 *   }} 
 * />
 * 
 * // With specific locale
 * <FormattedNumberServer value={1234.56} locale="ja-JP" />
 * ```
 * 
 * @returns A Text component containing the formatted number
 */
const FormattedNumberServer: React.FC<FormattedNumberServerProps> = ({
  value,
  formatOptions,
  locale,
  ...textProps
}) => {
  const formattedNumber = formatNumber(value, locale, formatOptions);
  return <Text {...textProps}>{formattedNumber}</Text>;
};

export default FormattedNumberServer; 