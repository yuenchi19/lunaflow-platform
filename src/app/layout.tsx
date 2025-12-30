import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import HeaderWrapper from "@/components/HeaderWrapper";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LunaFlow - Online Education Platform",
  description: "Learn new skills with our immersive video courses.",
  other: {
    google: "notranslate",
  },
};

import { AccessControl } from "@/components/AccessControl";

// ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" translate="no">
      <body className={inter.className}>
        <AccessControl>
          <HeaderWrapper />
          {children}
          {/* PromoteKit Tracking Script */}
          {/* Use standard next/script for third-party scripts */}
          { /* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
          <Script
            src="https://cdn.promotekit.com/promotekit.js"
            strategy="afterInteractive"
            data-promotekit="8b96c931-3fa9-460e-bba8-1e5c42ed5254"
          />
        </AccessControl>
      </body>
    </html>
  );
}
