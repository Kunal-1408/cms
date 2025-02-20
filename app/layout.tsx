import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarDemo from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quite Good CMS",
  description: "Customer Management System",
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
          <SessionProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <div className="grid grid-cols-5 bg-slate-50 dark:bg-neutral-700">
                <SidebarDemo />
                <main className="col-span-4">{children}
                <Toaster />
                </main>
              </div>
            </Suspense>
          </SessionProvider>
            </body>
    </html>
  );
}
