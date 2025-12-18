// Cart management using localStorage with session ID
export type CartItem = {
  id: string
  name: string
  name_en: string | null
  price: number
  quantity: number
  image_url: string | null
}

const CART_KEY = "mala_cart"
const SESSION_KEY = "mala_session_id"
const ORDER_HISTORY_KEY = "mala_order_history"
const RATE_LIMIT_KEY = "mala_rate_limit"
const BLOCK_KEY = "mala_block_until"

// Generate a unique session ID for each device
export function getSessionId(): string {
  if (typeof window === "undefined") return ""

  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return []

  const cartData = localStorage.getItem(CART_KEY)
  return cartData ? JSON.parse(cartData) : []
}

export function saveCart(cart: CartItem[]): void {
  if (typeof window === "undefined") return

  localStorage.setItem(CART_KEY, JSON.stringify(cart))
}

export function addToCart(item: Omit<CartItem, "quantity">): void {
  const cart = getCart()
  const existingItem = cart.find((i) => i.id === item.id)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.push({ ...item, quantity: 1 })
  }

  saveCart(cart)
}

export function updateCartItemQuantity(itemId: string, quantity: number): void {
  const cart = getCart()
  const item = cart.find((i) => i.id === itemId)

  if (item) {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      item.quantity = quantity
      saveCart(cart)
    }
  }
}

export function removeFromCart(itemId: string): void {
  const cart = getCart().filter((i) => i.id !== itemId)
  saveCart(cart)
}

export function clearCart(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(CART_KEY)
}

export function calculateDiscount(totalSticks: number): number {
  if (totalSticks >= 30) return 40
  if (totalSticks >= 20) return 20
  if (totalSticks >= 10) return 10
  return 0
}

export function getCartTotal(): number {
  const subtotal = getCart().reduce((total, item) => total + item.price * item.quantity, 0)
  return subtotal
}

export function getCartTotalWithDiscount(): { subtotal: number; discount: number; total: number; stickCount: number } {
  const cart = getCart()
  const stickCount = cart.reduce((count, item) => count + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const discount = calculateDiscount(stickCount)
  const total = Math.max(0, subtotal - discount)

  return { subtotal, discount, total, stickCount }
}

export function getCartItemCount(): number {
  return getCart().reduce((count, item) => count + item.quantity, 0)
}

// Order history management functions
export function saveOrderToHistory(orderId: string): void {
  if (typeof window === "undefined") return

  const sessionId = getSessionId()
  const historyData = localStorage.getItem(ORDER_HISTORY_KEY)
  const history = historyData ? JSON.parse(historyData) : {}

  if (!history[sessionId]) {
    history[sessionId] = []
  }

  // Add order ID if not already in history
  if (!history[sessionId].includes(orderId)) {
    history[sessionId].unshift(orderId) // Add to beginning for newest first
  }

  localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(history))
}

export function getOrderHistory(): string[] {
  if (typeof window === "undefined") return []

  const sessionId = getSessionId()
  const historyData = localStorage.getItem(ORDER_HISTORY_KEY)
  const history = historyData ? JSON.parse(historyData) : {}

  return history[sessionId] || []
}

// Rate limiting functions to prevent spam orders
export function checkRateLimit(): { allowed: boolean; message?: string; waitTime?: number } {
  if (typeof window === "undefined") return { allowed: true }

  const sessionId = getSessionId()
  const blockUntilData = localStorage.getItem(BLOCK_KEY)
  const blockData = blockUntilData ? JSON.parse(blockUntilData) : {}

  // Check if session is currently blocked
  if (blockData[sessionId]) {
    const blockUntil = new Date(blockData[sessionId]).getTime()
    const now = Date.now()

    if (now < blockUntil) {
      const remainingMinutes = Math.ceil((blockUntil - now) / 60000)
      return {
        allowed: false,
        message: `คุณถูกบล็อคชั่วคราวเนื่องจากสั่งอาหารบ่อยเกินไป กรุณารอ ${remainingMinutes} นาที`,
        waitTime: remainingMinutes,
      }
    } else {
      // Block expired, remove it
      delete blockData[sessionId]
      localStorage.setItem(BLOCK_KEY, JSON.stringify(blockData))
    }
  }

  // Check rate limit (3 orders within 20 seconds)
  const rateLimitData = localStorage.getItem(RATE_LIMIT_KEY)
  const rateLimits = rateLimitData ? JSON.parse(rateLimitData) : {}

  const now = Date.now()
  const sessionLimits = rateLimits[sessionId] || []

  // Filter out old timestamps (older than 20 seconds)
  const recentOrders = sessionLimits.filter((timestamp: number) => now - timestamp < 20000)

  if (recentOrders.length >= 3) {
    // Block for 10 minutes
    const blockUntil = new Date(now + 10 * 60 * 1000).toISOString()
    blockData[sessionId] = blockUntil
    localStorage.setItem(BLOCK_KEY, JSON.stringify(blockData))

    // Clear rate limit data for this session
    delete rateLimits[sessionId]
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rateLimits))

    return {
      allowed: false,
      message: "คุณสั่งอาหารบ่อยเกินไป ระบบได้ทำการบล็อคชั่วคราว 10 นาที เพื่อป้องกันการก่อกวน",
      waitTime: 10,
    }
  }

  return { allowed: true }
}

export function recordOrderAttempt(): void {
  if (typeof window === "undefined") return

  const sessionId = getSessionId()
  const rateLimitData = localStorage.getItem(RATE_LIMIT_KEY)
  const rateLimits = rateLimitData ? JSON.parse(rateLimitData) : {}

  const now = Date.now()
  const sessionLimits = rateLimits[sessionId] || []

  // Add current timestamp
  sessionLimits.push(now)

  // Keep only recent timestamps (last 20 seconds)
  rateLimits[sessionId] = sessionLimits.filter((timestamp: number) => now - timestamp < 20000)

  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rateLimits))
}
