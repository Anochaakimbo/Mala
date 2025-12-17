"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Clock, CheckCircle, XCircle, ChefHat, Flame, AlertTriangle } from "lucide-react"
import { getOrderHistory } from "@/lib/cart-storage"
import { createBrowserClient } from "@/lib/supabase/client"

type OrderItem = {
  menu_item_name: string
  quantity: number
  menu_item_price: number
}

type Order = {
  id: string
  created_at: string
  customer_name: string
  total_amount: number
  original_total_amount: number | null
  is_modified: boolean
  status: string
  spice_level: string
  order_items: OrderItem[]
}

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadOrders()

    const orderIds = getOrderHistory()
    if (orderIds.length === 0) return

    const supabase = createBrowserClient()

    const channel = supabase
      .channel("order-history-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=in.(${orderIds.join(",")})`,
        },
        () => {
          loadOrders()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          loadOrders()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const orderIds = getOrderHistory()
      if (orderIds.length === 0) {
        setLoading(false)
        return
      }

      const supabase = createBrowserClient()

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, created_at, customer_name, total_amount, original_total_amount, is_modified, status, spice_level")
        .in("id", orderIds)
        .order("created_at", { ascending: false })

      if (ordersError) throw ordersError

      if (!ordersData || ordersData.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }

      // Fetch order items for all orders
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("order_id, menu_item_name, quantity, menu_item_price")
        .in(
          "order_id",
          ordersData.map((o) => o.id),
        )

      if (itemsError) throw itemsError

      // Combine orders with their items
      const ordersWithItems = ordersData.map((order) => ({
        ...order,
        order_items: itemsData?.filter((item) => item.order_id === order.id) || [],
      }))

      setOrders(ordersWithItems)
    } catch (error) {
      console.error("Error loading order history:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
    > = {
      pending: { label: "รอดำเนินการ", variant: "secondary", icon: Clock },
      confirmed: { label: "ยืนยันแล้ว", variant: "default", icon: CheckCircle },
      preparing: { label: "กำลังทำอาหาร", variant: "default", icon: ChefHat },
      ready: { label: "พร้อมส่ง", variant: "default", icon: CheckCircle },
      completed: { label: "สำเร็จ", variant: "outline", icon: CheckCircle },
      cancelled: { label: "ยกเลิก", variant: "destructive", icon: XCircle },
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getSpiceLevelDisplay = (level: string) => {
    const spiceLevels: Record<string, { label: string; color: string; count: number }> = {
      ไม่เผ็ด: { label: "ไม่เผ็ด", color: "text-green-600", count: 0 },
      เผ็ดน้อย: { label: "เผ็ดน้อย", color: "text-orange-500", count: 1 },
      เผ็ดกลาง: { label: "เผ็ดกลาง", color: "text-orange-600", count: 2 },
      เผ็ดมาก: { label: "เผ็ดมาก", color: "text-red-600", count: 3 },
      เผ็ดมากพิเศษ: { label: "เผ็ดมากพิเศษ", color: "text-red-700", count: 4 },
    }

    const config = spiceLevels[level] || spiceLevels["ไม่เผ็ด"]

    return (
      <span className={`flex items-center gap-1 text-sm font-medium ${config.color}`}>
        {Array.from({ length: config.count }).map((_, i) => (
          <Flame key={i} className="h-3 w-3 fill-current" />
        ))}
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <div className="animate-pulse">กำลังโหลด...</div>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900">
          <ClipboardList className="h-5 w-5" />
          ประวัติการสั่งอาหาร
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-lg p-4 hover:bg-red-50 transition-colors cursor-pointer"
            onClick={() => router.push(`/order/${order.id}`)}
          >
            {order.is_modified && (
              <Badge variant="outline" className="mb-2 border-orange-500 text-orange-700">
                <AlertTriangle className="h-3 w-3 mr-1" />
                มีการแก้ไข
              </Badge>
            )}

            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="mb-3 space-y-1 bg-gray-50 rounded p-3">
              {order.order_items?.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.menu_item_name} x{item.quantity}
                  </span>
                  <span className="text-gray-600">฿{(item.menu_item_price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-3">{getSpiceLevelDisplay(order.spice_level)}</div>
              <div className="text-right">
                {order.is_modified && order.original_total_amount && (
                  <p className="text-xs text-gray-500 line-through">฿{order.original_total_amount.toFixed(0)}</p>
                )}
                <span className="font-bold text-red-600">฿{order.total_amount.toFixed(0)}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
