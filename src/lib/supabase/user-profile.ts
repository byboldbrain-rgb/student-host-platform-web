import { createClient } from '@/src/lib/supabase/client'

export type CurrentPlatformUser = {
  id: string
  email: string | null
}

export async function getCurrentPlatformUser(): Promise<CurrentPlatformUser | null> {
  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw new Error(error.message)
  }

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email ?? null,
  }
}