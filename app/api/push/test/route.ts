import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { sendTestPushNotificationToUser } from '@/src/lib/push-notifications'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          message: 'You must be logged in to test push notifications.',
        },
        { status: 401 }
      )
    }

    const result = await sendTestPushNotificationToUser({
      userId: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to send test push notification:', error)

    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to send test push notification.',
      },
      { status: 500 }
    )
  }
}