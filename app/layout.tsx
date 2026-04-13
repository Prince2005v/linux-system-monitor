import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Linux System Monitor',
  description: 'A Next.js dashboard for Linux system metrics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
