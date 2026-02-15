import { ProductCard } from "@/components/product-card"

const products = [
  {
    id: 1,
    name: "Hopone crew shirts black",
    price: "25€",
    image: "/image.png",
  },
  {
    id: 2,
    name: "Hopone crew shirts blue",
    price: "25€",
    image: "/image2.png",
  },
]

export default function ShirtsPage() {
  return (
    <div className="py-2 md:py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-16 max-w-4xl">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            price={product.price}
            image={product.image}
          />
        ))}
      </div>
    </div>
  )
}
