import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'telugu.social',
  description: 'A Telugu-first digital adda for Gen Z communities.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
