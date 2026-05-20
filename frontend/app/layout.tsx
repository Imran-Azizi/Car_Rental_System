import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/context';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'مرکز کرایه موتر افشار',
  description: 'سیستم مدیریت کرایه موتر افشار',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-farsi">
        <AppProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 3000, style: { fontFamily: 'Amiri, Vazirmatn, serif', direction: 'rtl', background: '#fffdf0', border: '1px solid #f59e0b', color: '#92400e' } }} />
        </AppProvider>
      </body>
    </html>
  );
}
