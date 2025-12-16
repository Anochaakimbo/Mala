"use client"

import { useState, useEffect } from "react"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCartItemCount } from "@/lib/cart-storage"
import { useRouter } from "next/navigation"

export function CartButton() {
  const [itemCount, setItemCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Update cart count on mount and when storage changes
    const updateCount = () => setItemCount(getCartItemCount())
    updateCount()

    // Listen for storage changes (when cart is updated in other components)
    window.addEventListener("storage", updateCount)
    // Custom event for same-tab updates
    window.addEventListener("cart-updated", updateCount)

    return () => {
      window.removeEventListener("storage", updateCount)
      window.removeEventListener("cart-updated", updateCount)
    }
  }, [])

  return (
    <Button
      onClick={() => router.push("/cart")}
      size="lg"
      className="fixed bottom-6 right-6 rounded-full shadow-2xl bg-red-600 hover:bg-red-700 text-white z-50 h-16 w-16 p-0"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-orange-500 hover:bg-orange-600 text-white text-xs h-6 w-6 flex items-center justify-center rounded-full p-0">
            {itemCount}
          </Badge>
        )}
      </div>
    </Button>
  )
}
