import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

import { ClerkProvider } from '@clerk/nextjs';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'AI Contests Navigator',
  description: 'The definitive terminal for global AI competitions.',
  authors: [{ name: 'nev4rb14su', url: 'https://github.com/nev4rb14su' }],
  creator: 'nev4rb14su',
};

import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${jetbrainsMono.variable} bg-canvas text-text-main font-mono antialiased selection:bg-primary selection:text-white`}
        >
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
