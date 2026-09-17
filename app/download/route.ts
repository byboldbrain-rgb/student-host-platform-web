import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=com.navienty.now'

const APP_STORE_URL =
  'https://apps.apple.com/eg/app/navienty-now/id6804870140'

export function GET(request: NextRequest) {
  const userAgent =
    request.headers.get('user-agent')?.toLowerCase() || ''

  const isAndroid =
    /android/.test(userAgent)

  const isIOS =
    /iphone|ipad|ipod/.test(userAgent)

  if (isAndroid) {
    return NextResponse.redirect(
      GOOGLE_PLAY_URL,
      302
    )
  }

  if (isIOS) {
    return NextResponse.redirect(
      APP_STORE_URL,
      302
    )
  }

  // Desktop / unknown device fallback
  return NextResponse.redirect(
    APP_STORE_URL,
    302
  )
}