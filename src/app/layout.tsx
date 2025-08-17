import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar, Providers, StableLayout, SessionProvider } from "@/components/layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voting Gaming - Interactive Multiplayer Game",
  description: "A real-time multiplayer voting game built with Next.js, Socket.IO, and Prisma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* SessionProvider wraps everything to provide session context */}
        <SessionProvider>
          {/* NavBar is outside other providers but inside SessionProvider */}
          <NavBar />
          
          {/* Stable layout wrapper prevents re-renders */}
          <StableLayout>
            {/* Other providers wrap only the page content */}
            <Providers>
              {children}
            </Providers>
          </StableLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
