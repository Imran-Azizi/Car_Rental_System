import type { Metadata } from 'next';
import { Amiri, Vazirmatn } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/context';
import { Toaster } from 'react-hot-toast';

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-amiri',
  display: 'swap',
  preload: true,
});

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-vazirmatn',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'مرکز کرایه موتر افشار',
  description: 'سیستم مدیریت کرایه موتر افشار',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${amiri.variable} ${vazirmatn.variable}`}>
      <body className="font-farsi">
        <AppProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: 'var(--font-amiri), var(--font-vazirmatn), serif',
                direction: 'rtl',
                background: '#fffdf0',
                border: '1px solid #f59e0b',
                color: '#78350f',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 16px rgba(120, 53, 15, 0.15)',
                padding: '12px 16px',
              },
              success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
              error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
        </AppProvider>
      </body>
    </html>
  );
}
