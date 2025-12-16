"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/lib/supabase/client"
import { Clock, CheckCircle2, Loader2, Home } from "lucide-react"

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  spice_level: string
  payment_method: string
  payment_slip_url: string | null
  status: string
  total_amount: number
  notes: string | null
  created_at: string
}

type OrderItem = {
  id: string
  menu_item_name: string
  menu_item_price: number
  quantity: number
  subtotal: number
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "รอดำเนินการ", color: "bg-yellow-500", icon: Clock },
  preparing: { label: "กำลังเตรียม", color: "bg-orange-500", icon: Loader2 },
  ready: { label: "พร้อมส่ง", color: "bg-green-500", icon: CheckCircle2 },
  completed: { label: "เสร็จสิ้น", color: "bg-gray-500", icon: CheckCircle2 },
  cancelled: { label: "ยกเลิก", color: "bg-red-500", icon: Clock },
}

export default function OrderStatusPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      const supabase = createBrowserClient()

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", params.id)
        .single()

      if (orderError) {
        console.error("Error fetching order:", orderError)
        setLoading(false)
        return
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", params.id)

      if (itemsError) {
        console.error("Error fetching order items:", itemsError)
      }

      setOrder(orderData)
      setOrderItems(itemsData || [])
      setLoading(false)
    }

    fetchOrder()

    // Subscribe to real-time updates
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`order-${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          setOrder(payload.new as Order)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 p-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">ไม่พบรายการสั่งซื้อ</p>
              <Button onClick={() => router.push("/")} className="mt-4 bg-red-600 hover:bg-red-700">
                กลับไปหน้าหลัก
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const statusInfo = statusMap[order.status] || statusMap.pending
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button onClick={() => router.push("/")} variant="ghost" className="mb-4">
          <Home className="h-4 w-4 mr-2" />
          กลับไปหน้าหลัก
        </Button>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-2xl text-red-900 flex items-center justify-between">
              <span>สถานะออเดอร์</span>
              <Badge className={`${statusInfo.color} text-white text-base px-4 py-2`}>
                <StatusIcon className={`h-5 w-5 mr-2 ${order.status === "preparing" ? "animate-spin" : ""}`} />
                {statusInfo.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">หมายเลขออเดอร์</p>
              <p className="font-mono text-sm">{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">วันที่สั่ง</p>
              <p>{new Date(order.created_at).toLocaleString("th-TH")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>รายการอาหาร</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orderItems.map((item) => (
              <div key={item.id} className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{item.menu_item_name}</p>
                  <p className="text-sm text-muted-foreground">
                    ฿{item.menu_item_price.toFixed(0)} x {item.quantity}
                  </p>
                </div>
                <p className="font-bold">฿{item.subtotal.toFixed(0)}</p>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg pt-2">
              <span>ยอดรวม</span>
              <span className="text-red-600">฿{order.total_amount.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลการจัดส่ง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">ชื่อผู้รับ</p>
              <p>{order.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
              <p>{order.customer_phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ที่อยู่จัดส่ง</p>
              <p>{order.delivery_address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ระดับความเผ็ด</p>
              <p>{order.spice_level}</p>
            </div>
            {order.notes && (
              <div>
                <p className="text-sm text-muted-foreground">หมายเหตุ</p>
                <p>{order.notes}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">การชำระเงิน</p>
              <p>{order.payment_method === "cash" ? "ชำระหลังได้รับออเดอร์" : "โอนเงินผ่านสลิป"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
