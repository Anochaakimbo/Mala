import type React from "react"
import type { Metadata } from "next"
import { Prompt } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "หม่าล่า 3 ระดับ - เมนูหม่าล่าเสียบไม้",
  description: "เมนูหม่าล่าเสียบไม้รสจัดจ้าน อร่อยเด็ด",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body className={`${prompt.className} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
