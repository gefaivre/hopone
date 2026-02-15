import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'

const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Hopone',
  description: 'Hopone - Athletic Clothing Brand',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 px-4 md:px-8 lg:px-12">
          <SiteNav />
          <main className="flex-1 py-4 md:py-0">{children}</main>
        </div>
        <SiteFooter />
      </body>
    </html>
  )
}
