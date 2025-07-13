'use client';

import React from 'react';
import { useFormatting } from '@plyaz/translations/frontend';
import type { TextProps } from '@plyaz/ui';
import { Text } from '@plyaz/ui';

interface FormattedDateProps extends Omit<TextProps, 'children'> {
  date: Date | string | number;
  formatOptions?: Intl.DateTimeFormatOptions;
  locale?: string;
}

/**
 * FormattedDate component for client-side date formatting.
 * 
 * Renders a date value with proper internationalization formatting.
 * Uses the client-side formatting utilities from @plyaz/translations.
 * 
 * @param props - Component props
 * @param props.date - The date to format (Date object, ISO string, or timestamp)
 * @param props.formatOptions - Optional Intl.DateTimeFormatOptions for custom formatting
 * @param props.locale - Optional locale override (defaults to current locale)
 * @param props.textProps - Additional Text component props
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <FormattedDate date={new Date()} />
 * 
 * // With custom formatting
 * <FormattedDate 
 *   date="2023-12-25" 
 *   formatOptions={{ 
 *     year: 'numeric', 
 *     month: 'long', 
 *     day: 'numeric' 
 *   }} 
 * />
 * 
 * // With specific locale
 * <FormattedDate date={new Date()} locale="es-ES" />
 * ```
 * 
 * @returns A Text component containing the formatted date
 */
const FormattedDate: React.FC<FormattedDateProps> = ({
  date,
  formatOptions,
  locale,
  ...textProps
}) => {
  const { formatDate } = useFormatting(locale);
  const formattedDate = formatDate(date, formatOptions);
  return <Text {...textProps}>{formattedDate}</Text>;
};

export default FormattedDate;
