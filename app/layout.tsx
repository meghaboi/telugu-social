import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/toast-provider';

const siteUrl = 'https://telugu.social';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'telugu.social',
    template: '%s • telugu.social'
  },
  description: 'A Telugu-first digital adda for Gen Z communities to post, comment, react, and build safer local conversations.',
  openGraph: {
    title: 'telugu.social',
    description: 'Join Telugu-first forums and connect with local communities.',
    url: siteUrl,
    siteName: 'telugu.social',
    locale: 'en_IN',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'telugu.social',
    description: 'Join Telugu-first forums and connect with local communities.'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
