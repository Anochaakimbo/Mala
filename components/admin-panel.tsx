"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Edit2, X, Check, Upload, ImageIcon, Power, Search } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

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

export function AdminPanel({ items }: { items: MenuItem[] }) {
  const [menuItems, setMenuItems] = useState(items)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    name_en: "",
    description: "",
    price: "",
    category: "ของเสียบ",
  })
  const router = useRouter()

  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems

    const query = searchQuery.toLowerCase()
    return menuItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        (item.name_en && item.name_en.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        item.price.toString().includes(query)
      )
    })
  }, [menuItems, searchQuery])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = fileName

    const { error: uploadError } = await supabase.storage.from("menu-images").upload(filePath, file)

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return null
    }

    const { data } = supabase.storage.from("menu-images").getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleAdd = async () => {
    if (!formData.name || !formData.price) {
      alert("กรุณากรอกชื่อและราคา")
      return
    }

    let imageUrl: string | null = null
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
      if (!imageUrl) {
        alert("ไม่สามารถอัพโหลดรูปภาพได้")
        return
      }
    }

    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        name: formData.name,
        name_en: formData.name_en || null,
        description: formData.description || null,
        price: Number.parseFloat(formData.price),
        category: formData.category,
        image_url: imageUrl,
      })
      .select()

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message)
      return
    }

    if (data) {
      setMenuItems([...data, ...menuItems])
      setFormData({
        name: "",
        name_en: "",
        description: "",
        price: "",
        category: "ของเสียบ",
      })
      setImageFile(null)
      setImagePreview(null)
      setIsAdding(false)
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบเมนูนี้?")) return

    const { error } = await supabase.from("menu_items").delete().eq("id", id)

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message)
      return
    }

    setMenuItems(menuItems.filter((item) => item.id !== id))
    router.refresh()
  }

  const handleEdit = async (id: string) => {
    if (!formData.name || !formData.price) {
      alert("กรุณากรอกชื่อและราคา")
      return
    }

    let imageUrl: string | null = null
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
      if (!imageUrl) {
        alert("ไม่สามารถอัพโหลดรูปภาพได้")
        return
      }
    }

    const updateData: any = {
      name: formData.name,
      name_en: formData.name_en || null,
      description: formData.description || null,
      price: Number.parseFloat(formData.price),
      category: formData.category,
    }

    if (imageUrl) {
      updateData.image_url = imageUrl
    }

    const { error } = await supabase.from("menu_items").update(updateData).eq("id", id)

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message)
      return
    }

    setMenuItems(
      menuItems.map((item) =>
        item.id === id
          ? {
              ...item,
              name: formData.name,
              name_en: formData.name_en || null,
              description: formData.description || null,
              price: Number.parseFloat(formData.price),
              category: formData.category,
              image_url: imageUrl || item.image_url,
            }
          : item,
      ),
    )
    setEditingId(null)
    setFormData({
      name: "",
      name_en: "",
      description: "",
      price: "",
      category: "ของเสียบ",
    })
    setImageFile(null)
    setImagePreview(null)
    router.refresh()
  }

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      name_en: item.name_en || "",
      description: item.description || "",
      price: item.price.toString(),
      category: item.category || "ของเสียบ",
    })
    setImagePreview(item.image_url)
    setImageFile(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: "",
      name_en: "",
      description: "",
      price: "",
      category: "ของเสียบ",
    })
    setImageFile(null)
    setImagePreview(null)
  }

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("menu_items").update({ is_available: !currentStatus }).eq("id", id)

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message)
      return
    }

    setMenuItems(menuItems.map((item) => (item.id === id ? { ...item, is_available: !currentStatus } : item)))
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Add New Item Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>เพิ่มเมนูใหม่</span>
            <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"} size="sm">
              {isAdding ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {isAdding ? "ยกเลิก" : "เพิ่ม"}
            </Button>
          </CardTitle>
        </CardHeader>
        {isAdding && (
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="image">รูปภาพเมนู</Label>
                <div className="flex items-center gap-4">
                  <Label
                    htmlFor="image"
                    className="flex items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 cursor-pointer transition-colors flex-1"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-sm">คลิกเพื่ออัพโหลดรูปภาพ</span>
                  </Label>
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                  {imagePreview && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-muted">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">ชื่อเมนู (ไทย)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น หมูสามชั้น"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name_en">ชื่อเมนู (อังกฤษ)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="เช่น Pork Belly"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="รายละเอียดเมนู"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">ราคา (บาท)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="15"
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                บันทึก
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Menu Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">เมนูทั้งหมด ({filteredMenuItems.length})</h2>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาเมนู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredMenuItems.length === 0 && searchQuery && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>ไม่พบเมนูที่ตรงกับคำค้นหา "{searchQuery}"</p>
            </CardContent>
          </Card>
        )}

        {filteredMenuItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              {editingId === item.id ? (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`edit-image-${item.id}`}>รูปภาพเมนู</Label>
                      <div className="flex items-center gap-4">
                        <Label
                          htmlFor={`edit-image-${item.id}`}
                          className="flex items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 cursor-pointer transition-colors flex-1"
                        >
                          <Upload className="h-5 w-5" />
                          <span className="text-sm">คลิกเพื่ออัพโหลดรูปภาพใหม่</span>
                        </Label>
                        <Input
                          id={`edit-image-${item.id}`}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                        {imagePreview && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-muted">
                            <img
                              src={imagePreview || "/placeholder.svg"}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>ชื่อเมนู (ไทย)</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>ชื่อเมนู (อังกฤษ)</Label>
                      <Input
                        value={formData.name_en}
                        onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>รายละเอียด</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>ราคา (บาท)</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(item.id)} className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      บันทึก
                    </Button>
                    <Button onClick={cancelEdit} variant="outline" className="flex-1 bg-transparent">
                      <X className="h-4 w-4 mr-2" />
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-3">
                  {item.image_url && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-muted flex-shrink-0">
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {!item.image_url && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-dashed border-muted flex-shrink-0 flex items-center justify-center bg-muted/50">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    {item.name_en && <p className="text-sm text-muted-foreground">{item.name_en}</p>}
                    {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="font-bold text-red-600">฿{item.price.toFixed(0)}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${item.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {item.is_available ? "พร้อมจำหน่าย" : "ปิดจำหน่าย"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleAvailability(item.id, item.is_available)}
                      variant={item.is_available ? "default" : "outline"}
                      size="icon"
                      className={item.is_available ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => startEdit(item)} variant="outline" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleDelete(item.id)} variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
