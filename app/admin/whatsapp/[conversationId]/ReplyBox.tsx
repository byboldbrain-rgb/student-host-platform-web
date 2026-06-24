'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState, useTransition } from 'react'
import { sendWhatsAppReplyAction } from './actions'

type ReplyBoxProps = {
  conversationId: string
}

type QuickReply = {
  label: string
  body: string
}

const quickReplies: QuickReply[] = [
  {
    label: 'طلب بيانات الطالب',
    body: `تمام، علشان نقدر نساعدك بشكل أسرع ابعتلنا البيانات دي:

1. اسمك بالكامل
2. رقم واتساب للتواصل
3. الجامعة / الكلية
4. طالب ولا طالبة؟
5. نوع السكن المطلوب
6. الميزانية المناسبة ليك
7. ميعاد مناسب للمعاينة`,
  },
  {
    label: 'تعليمات المعاينة',
    body: `تمام، قبل ما تروح تعاين السكن، مهم تعرف تعليمات Navienty:

1. لو السكن عجبك، كلمنا الأول قبل أي دفع.
2. الحجز بيتم من خلال المنصة بدفع أول شهر فقط.
3. من الشهر التاني بتدفع للمالك مباشرة.
4. لو تم الدفع خارج المنصة، Navienty مش هتكون مسؤولة عن أي نزاع بينك وبين المالك.

بعد المعاينة ابعتلنا رأيك، ولو مناسب هنكمل معاك خطوات الحجز.`,
  },
  {
    label: 'تعليمات الدفع',
    body: `تمام، لو السكن مناسب ليك وعاوز تحجز:

الحجز بيتم من خلال Navienty بدفع قيمة أول شهر إيجار فقط عن طريق طرق الدفع المتاحة.

بعد تأكيد الدفع، هيجيلك كود تأكيد الحجز، وده بيثبت إن حجزك تم من خلال المنصة.

من الشهر التاني بتدفع للمالك مباشرة.`,
  },
  {
    label: 'تحذير الدفع خارج المنصة',
    body: `تنبيه مهم من Navienty:

أي دفع يتم خارج المنصة بيكون على مسؤوليتك الشخصية، وNavienty مش هتكون مسؤولة عن أي نزاع أو مشكلة تحصل بينك وبين المالك.

علشان نقدر نحمي حجزك ونساعدك في أي مشكلة، لازم أول شهر يتم دفعه من خلال المنصة فقط.`,
  },
  {
    label: 'الشقة غير متاحة',
    body: `نعتذر، السكن ده غير متاح حاليًا أو تم حجزه.

ابعتلنا:
1. الجامعة أو المنطقة اللي عاوز تسكن قريب منها
2. نوع الغرفة المطلوبة
3. الميزانية المناسبة

وهنرشحلك أقرب اختيارات مناسبة من Navienty.`,
  },
  {
    label: 'ميزة التخزين',
    body: `لو حجزت من خلال Navienty، تقدر تستخدم خدمة تخزين الشنط مجانًا.

بعد تأكيد الحجز، هيجيلك كود تأكيد. احتفظ بالكود لأنه بيتم استخدامه للاستفادة من التخزين المجاني.`,
  },
  {
    label: 'طلب Review',
    body: `نتمنى تكون تجربتك مع Navienty كانت مريحة ❤️

لو الخدمة عجبتك، ياريت تسيبلنا Review وتشارك تجربتك مع زمايلك في جروب الدفعة، ده بيساعد طلبة تانية تلاقي سكن آمن بسهولة.`,
  },
]

export default function ReplyBox({ conversationId }: ReplyBoxProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleQuickReplyClick(body: string) {
    setMessage(body)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const body = message.trim()

    if (!body) {
      setError('اكتب رسالة الأول.')
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await sendWhatsAppReplyAction(conversationId, body)

      if (!result.ok) {
        setError(result.error || 'فشل إرسال الرسالة.')
        return
      }

      setMessage('')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-4">
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="block text-sm font-medium">Reply</label>

          {message ? (
            <button
              type="button"
              onClick={() => {
                setMessage('')
                setError(null)
              }}
              className="text-xs font-medium text-gray-500 hover:text-black"
              disabled={isPending}
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <button
              key={reply.label}
              type="button"
              onClick={() => handleQuickReplyClick(reply.body)}
              disabled={isPending}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-black hover:bg-white disabled:opacity-50"
            >
              {reply.label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          placeholder="اكتب رسالة واتساب هنا..."
          className="w-full resize-none rounded-xl border p-3 text-sm outline-none focus:border-black"
          disabled={isPending}
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            {message.trim().length} characters
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? 'Sending...' : 'Send WhatsApp Message'}
        </button>
      </div>
    </form>
  )
}