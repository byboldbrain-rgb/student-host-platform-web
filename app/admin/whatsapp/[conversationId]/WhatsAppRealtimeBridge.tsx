'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

type Props = {
  conversationId: string
}

export default function WhatsAppRealtimeBridge({ conversationId }: Props) {
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

    function scheduleRefresh(reason: string) {
      console.log('[NAVIENTY_WHATSAPP_REALTIME] refresh:', reason)

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }

      refreshTimerRef.current = setTimeout(() => {
        router.refresh()
      }, 250)
    }

    const channel = supabase
      .channel(`admin-whatsapp-conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => scheduleRefresh('whatsapp_messages changed')
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
          filter: `id=eq.${conversationId}`,
        },
        () => scheduleRefresh('whatsapp_conversations changed')
      )
      .subscribe((status, error) => {
        console.log('[NAVIENTY_WHATSAPP_REALTIME] status:', status)

        if (error) {
          console.error('[NAVIENTY_WHATSAPP_REALTIME] error:', error)
        }
      })

    // Fallback polling so the inbox still updates even if Realtime policies fail.
    fallbackIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }, 3000)

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }

      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current)
      }

      supabase.removeChannel(channel)
    }
  }, [conversationId, router])

  return null
}
