"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { label: "Home", href: "/" },
  { label: "Accesories", href: "/accesories" },
  { label: "Shirts", href: "/shirts" },
  { label: "Shorts", href: "/shorts" },
]

export function SiteNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex flex-col justify-start pt-6 w-48 shrink-0" aria-label="Main navigation">
      <ul className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block text-xl font-bold transition-colors ${
                  isActive
                    ? "text-accent"
                    : "text-foreground hover:text-accent"
                }`}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
