import { createClient } from "@/lib/supabase/server"
import { MenuGrid } from "@/components/menu-grid"
import { CartButton } from "@/components/cart-button"
import { OrderHistory } from "@/components/order-history"
import { Flame } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default async function Home() {
  const supabase = await createClient()

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_available", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-600 text-white sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <Flame className="h-8 w-8" />
            <h1 className="text-3xl font-bold text-balance">หม่าล่า 3 ระดับ</h1>
            <Flame className="h-8 w-8" />
          </div>
          <p className="text-center text-red-50 mt-2 text-sm">หม่าล่าตรงข้าม Be to Sit</p>
        </div>
      </header>

      {/* Menu Content */}
      <main className="container mx-auto px-4 py-6">
        <OrderHistory />

        <MenuGrid items={menuItems || []} />
      </main>

      <CartButton />
      <Toaster />

      {/* Footer */}
      <footer className="bg-red-900 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-red-200">© 2025 หม่าล่า 3 ระดับ</p>
        </div>
      </footer>
    </div>
  )
}
