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
                  
                  if (saved === 'custom') {
                    var customVars = JSON.parse(localStorage.getItem('user-theme-custom-values') || '{}');
                    for (var key in customVars) {
                      if (customVars.hasOwnProperty(key)) {
                        document.documentElement.style.setProperty(key, customVars[key]);
                      }
                    }
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
        </Providers>
      </body>
    </html>
  );
}
