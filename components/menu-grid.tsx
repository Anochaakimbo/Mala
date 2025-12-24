"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { addToCart } from "@/lib/cart-storage"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type MenuItem = {
  id: string
  name: string
  name_en: string | null
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  is_available: boolean
}

export function MenuGrid({ items }: { items: MenuItem[] }) {
  const { toast } = useToast()
  const [menuItems, setMenuItems] = useState<MenuItem[]>(items)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setMenuItems(items)

    const channel = supabase!
      .channel("menu-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMenuItems((prev) => [payload.new as MenuItem, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setMenuItems((prev) => prev.map((item) => (item.id === payload.new.id ? (payload.new as MenuItem) : item)))
          } else if (payload.eventType === "DELETE") {
            setMenuItems((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [items])

  const handleAddToCart = (item: MenuItem) => {
    if (!item.is_available) {
      toast({
        title: "เมนูไม่พร้อมจำหน่าย",
        description: `${item.name} ไม่พร้อมจำหน่ายในขณะนี้`,
        variant: "destructive",
      })
      return
    }

    addToCart({
      id: item.id,
      name: item.name,
      name_en: item.name_en,
      price: item.price,
      image_url: item.image_url,
    })

    window.dispatchEvent(new Event("cart-updated"))

    toast({
      title: "เพิ่มลงตะกร้าแล้ว",
      description: `${item.name} ถูกเพิ่มในตะกร้าของคุณ`,
    })
  }

  const availableItems = menuItems
    .filter((item) => item.is_available)
    .filter((item) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        item.name.toLowerCase().includes(query) ||
        item.name_en?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.price.toString().includes(query)
      )
    })

  return (
    <div className="space-y-6">
      <div className="sticky top-[120px] z-[9] bg-gradient-to-b from-red-50 to-orange-50 pb-4 -mt-4 pt-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ค้นหาเมนู..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-red-200 focus:border-red-400 shadow-sm"
          />
        </div>
      </div>

      {availableItems.length === 0 && searchQuery ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">ไม่พบเมนูที่ค้นหา</p>
        </div>
      ) : !availableItems || availableItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">วันนี้ร้านปิดไว้กลับมาสั่งใหม่วันหลังนะจ้ะ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availableItems.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-red-100"
            >
              <CardContent className="p-0">
                {item.image_url && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={item.image_url || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-red-900">{item.name}</h3>
                      {item.name_en && <p className="text-sm text-muted-foreground">{item.name_en}</p>}
                      {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge className="bg-red-600 hover:bg-red-700 text-lg font-bold px-3 py-1">
                        ฿{item.price.toFixed(0)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddToCart(item)}
                    className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มลงตะกร้า
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
