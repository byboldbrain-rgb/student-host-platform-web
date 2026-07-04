'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

export default function WhatsAppInboxRealtimeBridge() {
  const router = useRouter()
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )

  if (!supabaseRef.current) {
    supabaseRef.current = createClient()
  }

  useEffect(() => {
    const supabase = supabaseRef.current
    if (!supabase) return

    function scheduleRefresh() {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }

      refreshTimerRef.current = setTimeout(() => {
        router.refresh()
      }, 300)
    }

    const channel = supabase
      .channel('admin-whatsapp-inbox-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
        },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        scheduleRefresh
      )
      .subscribe()

    fallbackIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }, 3000)

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current)
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}