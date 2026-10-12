'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveManualDispatchDecision, type DispatchLogState } from '../manual-dispatch-actions';

const initial: DispatchLogState = { outcome: 'idle', message: '' };
const reasonOptions = [
  ['same_area','بيجمع من نفس المنطقة'],
  ['same_store','رايح نفس المطعم'],
  ['available','المندوب متاح / الدور عليه'],
  ['customer_group','طلبات نفس العميل'],
  ['fast_prep','المطعم سريع التحضير'],
  ['next_trip','الرحلة القادمة أنسب'],
  ['other','سبب آخر'],
];
const stageOptions = [
  ['before_pickup','لسه مستلمش أول أوردر'],
  ['collecting','استلم أوردر وبيجمع'],
  ['to_hub','في طريقه للمعلمين'],
  ['returning','راجع من المعلمين'],
  ['unknown','مش محدد'],
];

function Submit() {
  const { pending } = useFormStatus();
  return <button disabled={pending} type="submit" className="min-h-11 w-full rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
    {pending ? 'جاري التسجيل…' : 'تسجيل قرار الإسناد'}
  </button>;
}

export default function ManualDispatchForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(saveManualDispatchDecision, initial);
  return (
    <section className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-950">سجل قرارات توزيع المندوبين</h2>
      <p className="mt-1 text-xs leading-5 text-slate-600">تسجيل فقط لمدة أسبوع — الاتصال بالمندوب بالتليفون كالمعتاد. لا يُغيّر حالة الطلب أو يسند مهمة تلقائيًا.</p>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="order_id" value={orderId}/>
        <label className="block text-xs font-semibold text-slate-700">اسم المندوب
          <input name="rider_name" required minLength={2} maxLength={100} autoComplete="off" placeholder="اسم ثابت للمندوب كل مرة" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"/>
        </label>
        <label className="block text-xs font-semibold text-slate-700">سبب الإسناد
          <select name="reason" required className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm">
            {reasonOptions.map(([key,label])=><option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-700">الرحلة
          <select name="trip_slot" required className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm">
            <option value="current">الحالية</option><option value="next">القادمة</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-700">حالة المندوب وقت القرار
          <select name="trip_stage" required defaultValue="unknown" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm">
            {stageOptions.map(([key,label])=><option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-700">ملاحظة اختيارية
          <textarea name="note" maxLength={500} rows={2} placeholder="مثلًا: بلبن جهز بسرعة فلحق الرحلة" className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"/>
        </label>
        <Submit/>
        {state.outcome !== 'idle' ? <p role="status" className={state.outcome==='error'?'text-xs text-red-700':'text-xs text-emerald-800'}>{state.message}</p>:null}
      </form>
    </section>
  );
}
