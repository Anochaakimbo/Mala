"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">ยังไม่มีเมนูในขณะนี้</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-red-100">
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
