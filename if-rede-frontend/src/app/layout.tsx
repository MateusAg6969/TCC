import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IF REDE",
  description: "Rede social acadêmica do IFC",
};

import Link from "next/link";
import { Toaster } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('user-theme') || 'default';
                  // Remove any existing theme class
                  var classes = document.documentElement.className.split(' ');
                  var cleanClasses = classes.filter(function(c) { return !c.startsWith('theme-'); });
                  cleanClasses.push('theme-' + saved);
                  document.documentElement.className = cleanClasses.join(' ').trim();
                  
                  function getContrastColor(hex) {
                    if (!hex) return '#ffffff';
                    var cleanHex = hex.replace('#', '');
                    if (cleanHex.length === 3) {
                      cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
                    }
                    var r = parseInt(cleanHex.substr(0, 2), 16);
                    var g = parseInt(cleanHex.substr(2, 2), 16);
                    var b = parseInt(cleanHex.substr(4, 2), 16);
                    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                    return (yiq >= 128) ? '#000000' : '#ffffff';
                  }

                  if (saved === 'custom') {
                    var customVars = JSON.parse(localStorage.getItem('user-theme-custom-values') || '{}');
                    for (var key in customVars) {
                      if (customVars.hasOwnProperty(key)) {
                        document.documentElement.style.setProperty(key, customVars[key]);
                      }
                    }
                    
                    var highlight = customVars['--brand-highlight'] || '#ADCC5A';
                    var titleBg = customVars['--brand-title-background'] || '#2A172B';
                    document.documentElement.style.setProperty('--brand-highlight-text', getContrastColor(highlight));
                    document.documentElement.style.setProperty('--brand-card-text', getContrastColor(titleBg));
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full bg-if-bg text-if-text">
        <Toaster position="top-right" richColors />
        <Providers>
          {children}
          <BottomNavigation />
        </Providers>
      </body>
    </html>
  );
}
