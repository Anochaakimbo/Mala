import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

declare global {
  var __supabase_client__: ReturnType<typeof createSupabaseBrowserClient> | undefined
}

function getSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error("Supabase client can only be used in the browser")
  }

  if (!globalThis.__supabase_client__) {
    globalThis.__supabase_client__ = createSupabaseBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  return globalThis.__supabase_client__
}

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseBrowserClient>, {
  get(_target, prop) {
    const client = getSupabaseClient()
    return client[prop as keyof typeof client]
  },
})

export function createBrowserClient() {
  return getSupabaseClient()
}

export function createClient() {
  return getSupabaseClient()
}
