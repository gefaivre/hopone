"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

const navItems = [
  { label: "Home", href: "/" },
  { label: "Accesories", href: "/accesories" },
  { label: "Shirts", href: "/shirts" },
  { label: "Shorts", href: "/shorts" },
]

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 text-foreground"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-foreground"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex flex-col px-6 pt-8" aria-label="Mobile navigation">
            <ul className="flex flex-col gap-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block text-2xl font-bold transition-colors ${
                        isActive
                          ? "text-accent"
                          : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="mt-auto pt-16">
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
