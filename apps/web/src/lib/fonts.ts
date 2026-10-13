import { DM_Serif_Display, IBM_Plex_Mono } from 'next/font/google';

export const fontHeading = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});

export const fontData = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-data',
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
});

