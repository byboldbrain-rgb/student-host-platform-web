'use client'

import { useFormStatus } from 'react-dom'

export default function WalletSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-black px-4 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'جاري إرسال الطلب...' : 'إرسال طلب الشحن'}
    </button>
  )
}