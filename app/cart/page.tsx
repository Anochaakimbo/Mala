"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react"
import {
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  getCartTotalWithDiscount,
  type CartItem,
} from "@/lib/cart-storage"

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const router = useRouter()

  useEffect(() => {
    setCart(getCart())
  }, [])

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    updateCartItemQuantity(itemId, newQuantity)
    setCart(getCart())
    window.dispatchEvent(new Event("cart-updated"))
  }

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId)
    setCart(getCart())
    window.dispatchEvent(new Event("cart-updated"))
  }

  const { subtotal, discount, total, stickCount } = getCartTotalWithDiscount()

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 p-4">
        <div className="container mx-auto max-w-2xl">
          <Button onClick={() => router.push("/")} variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไปหน้าเมนู
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">ตะกร้าของคุณว่างเปล่า</p>
              <Button onClick={() => router.push("/")} className="mt-4 bg-red-600 hover:bg-red-700">
                เลือกเมนู
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button onClick={() => router.push("/")} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปหน้าเมนู
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-red-900">ตะกร้าของคุณ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 items-center border-b pb-4 last:border-b-0">
                {item.image_url && (
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-red-900">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">฿{item.price.toFixed(0)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-bold">{item.quantity}</span>
                  <Button size="sm" variant="outline" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-900">฿{(item.price * item.quantity).toFixed(0)}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>จำนวนไม้ทั้งหมด</span>
                <span>{stickCount} ไม้</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>ยอดรวม</span>
                <span>฿{subtotal.toFixed(0)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>ส่วนลด ({stickCount} ไม้)</span>
                  <span>-฿{discount.toFixed(0)}</span>
                </div>
              )}
              {discount > 0 && stickCount < 30 && (
                <p className="text-xs text-muted-foreground text-center py-2 bg-orange-50 rounded">
                  {stickCount < 10 && "สั่ง 10 ไม้ รับส่วนลด 10 บาท"}
                  {stickCount >= 10 && stickCount < 20 && "สั่ง 20 ไม้ รับส่วนลด 20 บาท"}
                  {stickCount >= 20 && stickCount < 30 && "สั่ง 30 ไม้ รับส่วนลด 40 บาท"}
                </p>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-bold">ยอดชำระทั้งหมด</span>
                <span className="text-2xl font-bold text-red-600">฿{total.toFixed(0)}</span>
              </div>
              <Button
                onClick={() => router.push("/checkout")}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6"
              >
                ดำเนินการสั่งซื้อ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
