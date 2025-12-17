"use client"

import type React from "react"
import { supabase } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Upload, Loader2, Copy, Check } from "lucide-react"
import { getCart, getCartTotalWithDiscount, clearCart, getSessionId, saveOrderToHistory } from "@/lib/cart-storage"
import { useToast } from "@/hooks/use-toast"

export default function CheckoutPage() {
  const [cart, setCart] = useState(getCart())
  const [loading, setLoading] = useState(false)
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [deliveryLocationOption, setDeliveryLocationOption] = useState("ร้าน HashTag(#)")
  const [paymentMethod, setPaymentMethod] = useState<"slip" | "cash">("slip")

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customDeliveryAddress: "",
    spiceLevel: "เผ็ดกลาง",
    notes: "",
  })

  useEffect(() => {
    if (cart.length === 0) {
      router.push("/")
    }
  }, [cart, router])

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSlipFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSlipPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const deliveryAddress = deliveryLocationOption === "อื่นๆ" ? formData.customDeliveryAddress : deliveryLocationOption

    if (deliveryLocationOption === "อื่นๆ" && !formData.customDeliveryAddress.trim()) {
      toast({
        title: "กรุณากรอกสถานที่จัดส่ง",
        description: "จำเป็นต้องระบุสถานที่จัดส่ง",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "slip" && !slipFile) {
      toast({
        title: "กรุณาแนบสลิปโอนเงิน",
        description: "จำเป็นต้องแนบหลักฐานการโอนเงิน",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const sessionId = getSessionId()
      const { subtotal, discount, total } = getCartTotalWithDiscount()

      let paymentSlipUrl = ""
      if (paymentMethod === "slip" && slipFile) {
        const fileName = `${sessionId}_${Date.now()}_${slipFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("payment-slips")
          .upload(fileName, slipFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from("payment-slips").getPublicUrl(fileName)

        paymentSlipUrl = urlData.publicUrl
      }

      const orderData = {
        session_id: sessionId,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        delivery_address: deliveryAddress,
        spice_level: formData.spiceLevel,
        payment_method: paymentMethod, // This is already 'slip' or 'cash' from state
        payment_slip_url: paymentSlipUrl || "", // Send empty string instead of null
        subtotal_amount: subtotal,
        discount_amount: discount,
        total_amount: total,
        notes: formData.notes,
        status: "pending",
      }

      const { data: createdOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = cart.map((item) => ({
        order_id: createdOrder.id,
        menu_item_id: item.id,
        menu_item_name: item.name,
        menu_item_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      saveOrderToHistory(createdOrder.id)

      clearCart()
      window.dispatchEvent(new Event("cart-updated"))

      toast({
        title: "สั่งอาหารสำเร็จ!",
        description: "คำสั่งซื้อของคุณได้รับการบันทึกแล้ว",
      })

      router.push(`/order/${createdOrder.id}`)
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสั่งอาหารได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyPromptPayNumber = () => {
    navigator.clipboard.writeText("0653320130")
    setCopied(true)
    toast({
      title: "คัดลอกแล้ว!",
      description: "คัดลอกหมายเลขพร้อมเพย์แล้ว",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const { subtotal, discount, total, stickCount } = getCartTotalWithDiscount()

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 p-4 pb-20">
      <div className="container mx-auto max-w-2xl">
        <Button onClick={() => router.push("/cart")} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปตะกร้า
        </Button>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-red-900">ข้อมูลการสั่งซื้อ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">ชื่อ*</Label>
                  <Input
                    id="customerName"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="กรอกชื่อ"
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone">เบอร์โทรศัพท์ *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="0xx-xxx-xxxx"
                  />
                </div>

                <div>
                  <Label>สถานที่จัดส่ง *</Label>
                  <RadioGroup
                    value={deliveryLocationOption}
                    onValueChange={setDeliveryLocationOption}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ร้าน HashTag(#)" id="location-hashtag" />
                      <Label htmlFor="location-hashtag" className="font-normal cursor-pointer">
                        HashTag(#)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Replay" id="location-replay" />
                      <Label htmlFor="location-replay" className="font-normal cursor-pointer">
                        Replay
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Be-to-Sit" id="location-betosit" />
                      <Label htmlFor="location-betosit" className="font-normal cursor-pointer">
                        Be-to-Sit
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="พร้อมมิตร" id="location-phrommit" />
                      <Label htmlFor="location-phrommit" className="font-normal cursor-pointer">
                        พร้อมมิตร
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="อโลน" id="location-alone" />
                      <Label htmlFor="location-alone" className="font-normal cursor-pointer">
                        อโลน
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="หลังมอ" id="location-langmo" />
                      <Label htmlFor="location-langmo" className="font-normal cursor-pointer">
                        หลังมอ
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="อื่นๆ" id="location-other" />
                      <Label htmlFor="location-other" className="font-normal cursor-pointer">
                        อื่นๆ / รับที่ร้าน (ลูกค้าสามารถให้ไปส่งหอบริเวณใกล้เคียงได้)
                      </Label>
                    </div>
                  </RadioGroup>

                  {deliveryLocationOption === "อื่นๆ" && (
                    <Textarea
                      className="mt-2"
                      value={formData.customDeliveryAddress}
                      onChange={(e) => setFormData({ ...formData, customDeliveryAddress: e.target.value })}
                      placeholder="กรอกสถานที่จัดส่ง"
                      rows={3}
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="spiceLevel">ระดับความเผ็ด *</Label>
                  <Select
                    value={formData.spiceLevel}
                    onValueChange={(value) => setFormData({ ...formData, spiceLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ไม่เผ็ด">ไม่เผ็ด</SelectItem>
                      <SelectItem value="เผ็ดน้อย">เผ็ดน้อย</SelectItem>
                      <SelectItem value="เผ็ดกลาง">เผ็ดกลาง</SelectItem>
                      <SelectItem value="เผ็ดมาก">เผ็ดมาก</SelectItem>
                      <SelectItem value="เผ็ดมากพิเศษ">เผ็ดมากพิเศษ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">หมายเหตุ (ถ้ามี)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="เช่น ไส้ทอดกรอบๆ"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Label>วิธีการชำระเงิน *</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value: any) => setPaymentMethod(value)}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="slip" id="payment-slip" />
                    <Label htmlFor="payment-slip" className="font-normal cursor-pointer">
                      แนบสลิปโอนเงิน
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="payment-cash" />
                    <Label htmlFor="payment-cash" className="font-normal cursor-pointer">
                      ชำระเงินหลังได้รับออเดอร์
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentMethod === "slip" && (
                <div className="space-y-4">
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-blue-900">ข้อมูลการโอนเงิน</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* PromptPay Number */}
                      <div>
                        <Label className="text-sm text-gray-700 mb-2 block">หมายเลขพร้อมเพย์</Label>
                        <div className="flex gap-2">
                          <Input value="0653320130" readOnly className="bg-white font-mono text-lg" />
                          <Button
                            type="button"
                            onClick={copyPromptPayNumber}
                            variant="outline"
                            className="px-4 bg-transparent"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* QR Code */}
                      <div>
                        <Label className="text-sm text-gray-700 mb-2 block">QR Code พร้อมเพย์</Label>
                        <div className="flex justify-center bg-white p-4 rounded-lg">
                          <img
                            src="/images/promptpay-qr.jpg"
                            alt="PromptPay QR Code"
                            className="w-full max-w-sm rounded-lg shadow-md"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <Label htmlFor="slip-upload">แนบสลิปการโอนเงิน *</Label>
                    <div className="mt-2">
                      <Input
                        id="slip-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleSlipChange}
                        className="hidden"
                      />
                      <Label
                        htmlFor="slip-upload"
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-600 transition-colors"
                      >
                        {slipPreview ? (
                          <img
                            src={slipPreview || "/placeholder.svg"}
                            alt="Payment slip preview"
                            className="h-full object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลดสลิป</p>
                            <p className="text-xs text-red-600 mt-1">*จำเป็นต้องแนบหลักฐานการโอนเงิน</p>
                          </div>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-2">สรุปรายการสั่งซื้อ</h3>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm mb-1">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>฿{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
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
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>ยอดชำระทั้งหมด</span>
                    <span className="text-red-600">฿{total.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    กำลังสั่งอาหาร...
                  </>
                ) : (
                  "ยืนยันการสั่งซื้อ"
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
