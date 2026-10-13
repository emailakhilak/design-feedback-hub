import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Design Feedback Hub — Portfolio Feedback & AI Critique',
  description:
    'A centralized, AI-powered portfolio feedback management application for UI/UX designers, developers, and students. Organize reviewer feedback, track progress, and generate Gemini AI critique.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FBFBFA] text-stone-900">
        {children}
      </body>
    </html>
  );
}
