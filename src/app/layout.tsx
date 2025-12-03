// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { auth } from "@/auth";
import { getUserByEmail } from "@/app/lib/backend";
import GlobalLayoutShell from "@/components/GlobalLayoutShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Compras Biocells",
  description: "Creado por Sistemas Biocells",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🔐 Traemos sesión y usuario SOLO aquí (server)
  const session = await auth();
  const user = session ? await getUserByEmail(session.user.email) : null;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 🧱 Layout global con sidebar + hamburguesa */}
        <GlobalLayoutShell session={session} user={user}>
          {children}
        </GlobalLayoutShell>
      </body>
    </html>
  );
}
