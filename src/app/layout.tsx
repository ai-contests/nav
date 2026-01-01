import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "AI Contests Navigator",
  description: "The definitive terminal for global AI competitions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_placeholder_for_build"}>
      <html lang="en">
        <body className={`${jetbrainsMono.variable} bg-canvas text-text-main font-mono antialiased selection:bg-primary selection:text-white`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
