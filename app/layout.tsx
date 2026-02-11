'use client'

import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { Header } from "@/components/Header"
import { Nav } from "@/components/Nav"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body className={`${inter.variable} antialiased`}>
        <SessionProvider>
          <Header />
          <Nav />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
