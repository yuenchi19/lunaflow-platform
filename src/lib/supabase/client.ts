import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fksvpyrvrzxmhhvetqrx.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrc3ZweXJ2cnp4bWhodmV0cXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTMwMTEsImV4cCI6MjA4MjQ4OTAxMX0.PbOlqcjwyVWpx3qumWu081IkTw1og4mv-Ycp-fdWkk8"
    )
}
