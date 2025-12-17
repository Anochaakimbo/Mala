import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

declare global {
  var __supabase_client: ReturnType<typeof createSupabaseBrowserClient> | undefined
}

export function createBrowserClient() {
  if (globalThis.__supabase_client) {
    return globalThis.__supabase_client
  }

  const client = createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  globalThis.__supabase_client = client

  return client
}

export function createClient() {
  return createBrowserClient()
}
