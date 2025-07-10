import { type Metadata } from 'next';
import React from 'react';
import './global.css';

export const metadata: Metadata = {
  title: 'Plyaz Fe Template',
  description: 'Plyaz Frontend Template',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
