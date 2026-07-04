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
      console.log('[WhatsApp Realtime] refresh scheduled:', reason)

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }

      refreshTimerRef.current = setTimeout(() => {
        router.refresh()
      }, 250)
    }

    supabase.auth.getSession().then(({ data, error }) => {
      console.log('[WhatsApp Realtime] has session:', Boolean(data.session))

      if (error) {
        console.error('[WhatsApp Realtime] session error:', error)
      }
    })

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
        (payload) => {
          console.log('[WhatsApp Realtime] message change:', payload)
          scheduleRefresh('whatsapp_messages changed')
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('[WhatsApp Realtime] conversation change:', payload)
          scheduleRefresh('whatsapp_conversations changed')
        }
      )
      .subscribe((status, error) => {
        console.log('[WhatsApp Realtime] status:', status)

        if (error) {
          console.error('[WhatsApp Realtime] subscribe error:', error)
        }
      })

    // Temporary fallback: حتى لو Realtime فيه مشكلة permission، الصفحة هتتحدث تلقائيًا بدون ما تدوس Refresh.
    // بعد ما تتأكد إن Realtime شغال، ممكن تزود الرقم أو تشيل الـ interval.
    fallbackIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }, 5000)

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