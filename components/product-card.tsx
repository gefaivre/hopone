import Image from "next/image"
import Link from "next/link"

interface ProductCardProps {
  name: string
  price: string
  image: string
  href?: string
}

export function ProductCard({ name, price, image, href = "#" }: ProductCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-square w-full bg-muted overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-3 text-center">
        <h3 className="text-sm font-bold text-foreground">{name}</h3>
        <p className="text-sm font-bold text-foreground">{price}</p>
      </div>
    </Link>
  )
}
