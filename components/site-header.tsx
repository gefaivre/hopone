"use client"

import Link from "next/link"
import Image from "next/image"
import { MobileMenu } from "./mobile-menu"

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-4 md:px-8 lg:px-12 pt-4 pb-2">
      <div className="md:hidden">
        <MobileMenu />
      </div>
      <Link href="/" className="mx-auto block">
        <Image
          src="/logo.png"
          alt="Hopone logo"
          width={80}
          height={80}
          className="h-16 w-auto md:h-20"
          priority
        />
      </Link>
      {/* Spacer for mobile to keep logo centered */}
      <div className="w-8 md:hidden" />
    </header>
  )
}
