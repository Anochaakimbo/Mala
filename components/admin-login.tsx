"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminPanel } from "@/components/admin-panel"
import { createClient } from "@/lib/supabase/client"

const ADMIN_PASSWORD = "11456"

export function AdminLogin() {
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // ตรวจสอบว่ามี session อยู่ใน localStorage หรือไม่
    const session = localStorage.getItem("admin_session")
    if (session === "authenticated") {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchMenuItems()
    }
  }, [isAuthenticated])

  const fetchMenuItems = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("menu_items").select("*").order("created_at", { ascending: false })
    setMenuItems(data || [])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem("admin_session", "authenticated")
      setError("")
    } else {
      setError("รหัสผ่านไม่ถูกต้อง")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("admin_session")
    setPassword("")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <span className="text-3xl">🔥</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
              <p className="text-gray-600">กรุณาใส่รหัสผ่านเพื่อเข้าสู่ระบบ</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                  className="h-12 text-center text-lg tracking-widest"
                  autoFocus
                />
                {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
              </div>

              <Button type="submit" className="w-full h-12 text-lg">
                เข้าสู่ระบบ
              </Button>

              <Link href="/" className="block">
                <Button variant="ghost" className="w-full" type="button">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  กลับไปหน้าเมนู
                </Button>
              </Link>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold">จัดการเมนู - Admin</h1>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <AdminPanel items={menuItems} />
      </main>
    </div>
  )
}
