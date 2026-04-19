import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/register-sw";

export const metadata: Metadata = {
  title: "Ember — a quiet fitness & wellness journal",
  description:
    "Pour your day in. Ember shapes it into clean, useful insight across training, journaling, and diet.",
  applicationName: "Ember",
  appleWebApp: {
    capable: true,
    title: "Ember",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var raw = localStorage.getItem('habits:settings');
              if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && parsed.theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              }
            } catch(e){}
            // Dev auto-cleanup: kill any stale service worker + cache on localhost so hot reload is clean.
            try {
              var h = location.hostname;
              var isLocal = h === 'localhost' || h === '127.0.0.1' || /^10\\./.test(h) || /^192\\.168\\./.test(h) || /^172\\.(1[6-9]|2\\d|3[0-1])\\./.test(h);
              if (isLocal) {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(rs){ rs.forEach(function(r){ r.unregister(); }); });
                }
                if ('caches' in window) {
                  caches.keys().then(function(ks){ ks.forEach(function(k){ caches.delete(k); }); });
                }
              }
            } catch(e){}`,
          }}
        />
        <link rel="apple-touch-icon" href="/apple-icon" />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
