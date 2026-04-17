// app/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // عند تحميل الصفحة، يتم توجيه المستخدم مباشرة إلى صفحة properties
    router.push('/properties')
  }, [router])

  return null // لا نعرض أي محتوى هنا لأننا نقوم بإعادة التوجيه
}