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
    console.log('[NAVIENTY_REALTIME_BRIDGE] mounted', {
      conversationId,
      version: '2026-07-04-v2',
    })

    const supabase = supabaseRef.current

    if (!supabase) {
      console.error('[NAVIENTY_REALTIME_BRIDGE] Supabase client missing')
      return
    }

    function refreshNow(reason: string) {
      console.log('[NAVIENTY_REALTIME_BRIDGE] refreshing:', reason)
      router.refresh()
    }

    function scheduleRefresh(reason: string) {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }

      refreshTimerRef.current = setTimeout(() => {
        refreshNow(reason)
      }, 250)
    }

    supabase.auth.getSession().then(({ data, error }) => {
      console.log('[NAVIENTY_REALTIME_BRIDGE] session:', {
        hasSession: Boolean(data.session),
        userId: data.session?.user?.id ?? null,
      })

      if (error) {
        console.error('[NAVIENTY_REALTIME_BRIDGE] session error:', error)
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
          console.log('[NAVIENTY_REALTIME_BRIDGE] message change:', payload)
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
          console.log(
            '[NAVIENTY_REALTIME_BRIDGE] conversation change:',
            payload
          )
          scheduleRefresh('whatsapp_conversations changed')
        }
      )
      .subscribe((status, error) => {
        console.log('[NAVIENTY_REALTIME_BRIDGE] status:', status)

        if (error) {
          console.error('[NAVIENTY_REALTIME_BRIDGE] subscribe error:', error)
        }
      })

    // Guaranteed fallback:
    // حتى لو Supabase Realtime فيه مشكلة RLS أو permissions،
    // الصفحة هتعمل refresh تلقائي كل 3 ثواني من غير ما تضغط Refresh.
    fallbackIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshNow('fallback polling')
      }
    }, 3000)

    return () => {
      console.log('[NAVIENTY_REALTIME_BRIDGE] unmounted')

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