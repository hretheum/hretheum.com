import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Eryk Orłowski — Product Design Leader & Experience Strategist',
  description: 'Portfolio & leadership playbook: 20+ years in Product Design, UX strategy, service design, AI-driven transformation. Case studies: ING, PKO, Warta, Sportradar.',
  keywords: 'Product Design Leader, UX Strategy, Design Systems, Service Design, AI Transformation, Design Leadership, User Experience',
  authors: [{ name: 'Eryk Orłowski' }],
  creator: 'Eryk Orłowski',
  publisher: 'Eryk Orłowski',
  robots: 'index,follow',
  metadataBase: new URL('https://hretheum.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Eryk Orłowski — Product Design Leader & Experience Strategist',
    description: '20+ years of design leadership. Selected case studies across fintech, SaaS, and InsurTech.',
    url: 'https://hretheum.com/',
    siteName: 'Eryk Orłowski Portfolio',
    images: [
      {
        url: '/og/cover-1200x630.jpg',
        width: 1200,
        height: 630,
        alt: 'Eryk Orłowski - Product Design Leader Portfolio',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eryk Orłowski — Product Design Leader & Experience Strategist',
    description: 'Design systems, org scaling, measurable impact. Case studies: ING, PKO, Warta, Sportradar.',
    images: ['/og/cover-1200x630.jpg'],
  },
  other: {
    'theme-color': '#7c3aed',
    'color-scheme': 'light',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicons */}
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Eryk Orłowski",
              "jobTitle": "Product Design Leader",
              "url": "https://hretheum.com/",
              "image": "https://hretheum.com/og/portrait.jpg",
              "sameAs": ["https://www.linkedin.com/in/eofek"]
            })
          }}
        />
        
        {/* Google Tag Manager */}
        <Script id="gtm-init" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-PD9LCGMR');
        `}</Script>
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-PD9LCGMR"
            height="0" 
            width="0" 
            style={{display: 'none', visibility: 'hidden'}}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}