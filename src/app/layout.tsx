'use client'

import { usePathname } from 'next/navigation'
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "./components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname()
  
  // Ocultamos el Sidebar solo en la pantalla de inicio
  const isHomePage = pathname === '/'

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex bg-gray-50 text-black`}>
        {!isHomePage && <Sidebar />}
        <main className={`flex-1 ${isHomePage ? 'w-full' : 'p-4 md:p-8'}`}>
          {children}
        </main>
      </body>
    </html>
  );
}