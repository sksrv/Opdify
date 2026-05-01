import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/common/Navbar.jsx';
import Footer from '../components/common/Footer';
import { AuthProvider } from '../context/AuthContext.jsx';
import { SocketProvider } from '../context/SocketContext';
import { icons } from 'lucide-react';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://opdify.com'), // replace with your actual domain

  title: {
    default: 'Opdify | Online Doctor Appointment Booking & Clinic Queue Management in India',
    template: '%s | Opdify',
  },

  description:
    'Opdify helps you book doctor appointments online and track real-time clinic queues across India. Skip long waiting times, manage OPD visits efficiently, and get instant updates.',

  keywords: [
    'doctor appointment booking India',
    'online doctor booking',
    'clinic queue management system',
    'OPD booking app',
    'hospital queue system India',
    'real-time queue tracking',
    'digital waiting list doctor',
    'healthcare scheduling software',
    'clinic management software India',
    'book doctor online India'
  ],

  authors: [{ name: 'Opdify Team' }],
  creator: 'Opdify',

  openGraph: {
    title: 'Opdify – Book Doctor Appointments & Track Live Queue',
    description:
      'Book doctor appointments instantly and track your real-time queue number. No waiting rooms. Faster OPD experience with Opdify.',
    url: 'https://opdify.com', // replace
    siteName: 'Opdify',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: '/og-image.png', // create a proper OG image (1200x630)
        width: 1200,
        height: 630,
        alt: 'Opdify – Smart Clinic Queue Management Platform',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Opdify – Smart Doctor Appointment & Queue Management',
    description:
      'Skip the waiting room. Book appointments and track your live queue with Opdify.',
    images: ['/og-image.png'],
  },

  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  category: 'healthcare',
};
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={font.variable}>
      <body className="min-h-screen bg-neutral-50 text-slate-900 antialiased">
        <AuthProvider>
          <SocketProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#0f1f18',
                  color: '#fff',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid rgba(22,163,90,0.25)',
                },
                success: { iconTheme: { primary: '#22c573', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
