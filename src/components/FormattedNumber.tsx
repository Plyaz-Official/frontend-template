'use client';

import React from 'react';
import { useFormatting } from '@plyaz/translations/frontend';
import type { TextProps } from '@plyaz/ui';
import { Text } from '@plyaz/ui';

interface FormattedNumberProps extends Omit<TextProps, 'children'> {
  value: number;
  formatOptions?: Intl.NumberFormatOptions;
  locale?: string;
}

/**
 * FormattedNumber component for client-side number formatting.
 * 
 * Renders a number value with proper internationalization formatting.
 * Uses the client-side formatting utilities from @plyaz/translations.
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
 * <FormattedNumber value={1234.56} />
 * 
 * // Currency formatting
 * <FormattedNumber 
 *   value={1234.56} 
 *   formatOptions={{ 
 *     style: 'currency', 
 *     currency: 'USD' 
 *   }} 
 * />
 * 
 * // Percentage formatting
 * <FormattedNumber 
 *   value={0.75} 
 *   formatOptions={{ 
 *     style: 'percent',
 *     minimumFractionDigits: 1 
 *   }} 
 * />
 * 
 * // With specific locale
 * <FormattedNumber value={1234.56} locale="de-DE" />
 * ```
 * 
 * @returns A Text component containing the formatted number
 */
const FormattedNumber: React.FC<FormattedNumberProps> = ({
  value,
  formatOptions,
  locale,
  ...textProps
}) => {
  const { formatNumber } = useFormatting(locale);
  const formattedNumber = formatNumber(value, formatOptions);
  return <Text {...textProps}>{formattedNumber}</Text>;
};

export default FormattedNumber;
