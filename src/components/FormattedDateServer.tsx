import React from 'react';
import { formatDate } from '@plyaz/translations';
import type { TextProps } from '@plyaz/ui';
import { Text } from '@plyaz/ui';

interface FormattedDateServerProps extends Omit<TextProps, 'children'> {
  date: Date | string | number;
  formatOptions?: Intl.DateTimeFormatOptions;
  locale?: string;
}

/**
 * FormattedDateServer component for server-side date formatting.
 * 
 * Renders a date value with proper internationalization formatting on the server.
 * Uses the server-side formatting utilities from @plyaz/translations.
 * This component is optimized for server-side rendering and static generation.
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
 * <FormattedDateServer date={new Date()} />
 * 
 * // With custom formatting
 * <FormattedDateServer 
 *   date="2023-12-25" 
 *   formatOptions={{ 
 *     weekday: 'long',
 *     year: 'numeric', 
 *     month: 'long', 
 *     day: 'numeric' 
 *   }} 
 * />
 * 
 * // With specific locale
 * <FormattedDateServer date={new Date()} locale="fr-FR" />
 * ```
 * 
 * @returns A Text component containing the formatted date
 */
const FormattedDateServer: React.FC<FormattedDateServerProps> = ({
  date,
  formatOptions,
  locale,
  ...textProps
}) => {
  const formattedDate = formatDate(date, locale, formatOptions);
  return <Text {...textProps}>{formattedDate}</Text>;
};

export default FormattedDateServer; 