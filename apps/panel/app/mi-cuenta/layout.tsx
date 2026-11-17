import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './portal.css';

export const metadata: Metadata = {
  title: 'Mi cuenta · CuentaFacil',
  description:
    'Tus contratos, actividades, soportes, documentos y pagos de CuentaFacil, junto a Pascal en WhatsApp.',
  robots: { index: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1F1F1F' };

export const dynamic = 'force-dynamic';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pt">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
      />
      {children}
    </div>
  );
}
