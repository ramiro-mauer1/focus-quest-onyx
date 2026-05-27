import type { Metadata, Viewport } from 'next';
import { Inter, Space_Mono } from 'next/font/google';
import { XPProvider } from '@/contexts/XPContext';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FocusQuest',
  description: 'Life OS RPG',
  manifest: '/manifest.webmanifest',
  applicationName: 'FocusQuest',
  appleWebApp: {
    capable: true,
    title: 'FocusQuest',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: [{ url: '/icon-192x192.png', type: 'image/png' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#a855f7',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceMono.variable}`}>
      <body className="font-sans">
        <XPProvider>
          <div
            id="root"
            className="relative z-[1] w-full max-w-[430px] min-h-dvh"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 56px)' }}
          >
            {children}
          </div>
        </XPProvider>
      </body>
    </html>
  );
}
