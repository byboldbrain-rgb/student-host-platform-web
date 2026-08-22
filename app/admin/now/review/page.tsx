import Link from 'next/link';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  IdCard,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

import { EmptyState, MetricCard, Notice, PageHeader, textareaClass } from '../components/ui-kit';
import { getNowReviewCenterData, type ReviewQueueRow } from '../lib/review-data';
import { getAllowedServiceBookingTransitions } from '../lib/workflows';
import type { NowAdminRow } from '../lib/table-data';
import {
  completeAccountDeletion,
  reviewOrderPaymentProof,
  reviewPrescription,
  reviewServicePaymentProof,
  startAccountDeletion,
  transitionServiceBooking,
  verifyOrderAge,
} from './actions';

function text(row: NowAdminRow, key: string) {
  const value = row[key];
  return value === null || value === undefined ? '' : String(value);
}
function formatDate(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' }).format(date);
}
function amount(row: NowAdminRow) {
  const value = Number(row.amount_snapshot ?? row.package_price ?? 0);
  const currency = text(row, 'currency_code_snapshot') || text(row, 'currency_symbol') || 'ج.م';
  return `${(Number.isFinite(value) ? value : 0).toLocaleString('ar-EG')} ${currency === 'EGP' ? 'ج.م' : currency}`;
}

const bookingLabels: Record<string, string> = {
  'awaiting-whatsapp-send': 'في انتظار واتساب',
  'waiting-confirmation': 'في انتظار التأكيد',
  confirmed: 'تم التأكيد',
  'picked-up': 'تم الاستلام',
  processing: 'جاري التنفيذ',
  'ready-for-delivery': 'جاهز للتوصيل',
  'out-for-delivery': 'خرج للتوصيل',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

function DecisionForm({ row, action, idField, idValue }: { row: ReviewQueueRow; action: (formData: FormData) => Promise<void>; idField: string; idValue: string }) {
  return (
    <form action={action} className="mt-4 border-t border-slate-100 pt-4">
      <input type="hidden" name={idField} value={idValue} />
      <label className="block text-xs font-black text-slate-600">ملاحظة للقرار — اختيارية
        <textarea name="note" rows={2} placeholder="اكتب سبب الرفض أو أي ملاحظة مهمة" className={`${textareaClass} min-h-20`} />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button name="decision" value="rejected" type="submit" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-black text-rose-800 hover:bg-rose-100">رفض</button>
        <button name="decision" value="approved" type="submit" className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white hover:bg-emerald-700">اعتماد</button>
      </div>
    </form>
  );
}

export default async function NowReviewPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const [data, query] = await Promise.all([getNowReviewCenterData(), searchParams]);
  const orderReviewCount = data.orderPaymentProofs.length + data.prescriptions.length + data.ageVerificationOrders.length;
  const serviceReviewCount = data.servicePaymentProofs.length;
  const totalDecisionCount = orderReviewCount + serviceReviewCount + data.accountDeletionRequests.length;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="مهام تحتاج قرار"
        title="المراجعات المعلقة"
        description="كل عنصر هنا يحتاج من الموظف مشاهدة المستند أو البيانات ثم اتخاذ قرار واضح. لا يتم تعديل الحالات يدويًا."
        icon={<ShieldCheck size={16} />}
      />

      {query.success ? <Notice tone="success" title={query.success} /> : null}
      {query.error ? <Notice tone="warning" title="تعذر تنفيذ العملية">{query.error}</Notice> : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="إثباتات دفع طلبات" value={data.orderPaymentProofs.length} tone={data.orderPaymentProofs.length ? 'amber' : 'slate'} icon={<ReceiptText size={17} />} />
        <MetricCard label="روشتات" value={data.prescriptions.length} tone={data.prescriptions.length ? 'amber' : 'slate'} icon={<FileCheck2 size={17} />} />
        <MetricCard label="تحقق من العمر" value={data.ageVerificationOrders.length} tone={data.ageVerificationOrders.length ? 'amber' : 'slate'} icon={<IdCard size={17} />} />
        <MetricCard label="طلبات حذف حساب" value={data.accountDeletionRequests.length} tone={data.accountDeletionRequests.length ? 'amber' : 'slate'} icon={<Trash2 size={17} />} />
      </section>

      {totalDecisionCount === 0 && data.serviceBookings.length === 0 ? (
        <EmptyState title="مفيش مراجعات معلقة" description="كل القرارات المطلوبة تم التعامل معها حاليًا." icon={<CheckCircle2 size={22} />} />
      ) : null}

      {data.orderPaymentProofs.length > 0 ? (
        <section className="space-y-3">
          <div><h2 className="text-lg font-black">إثباتات دفع الطلبات</h2><p className="mt-1 text-xs font-semibold text-slate-500">افتح صورة التحويل وتأكد من المبلغ قبل الاعتماد.</p></div>
          <div className="grid gap-4 xl:grid-cols-2">
            {data.orderPaymentProofs.map((row) => {
              const orderId = text(row, 'order_id');
              return <article key={text(row, 'id')} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black text-slate-400">طلب</p><Link href={`/admin/now/orders/${orderId}`} className="mt-1 inline-flex items-center gap-1 font-black text-violet-700">فتح الطلب <ArrowLeft size={13} /></Link></div><p className="text-lg font-black">{amount(row)}</p></div>
                <p className="mt-3 text-xs font-semibold text-slate-400">تم الرفع {formatDate(row.submitted_at ?? row.created_at)}</p>
                {row.signed_url ? <a href={row.signed_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-800"><ExternalLink size={14} /> مشاهدة إثبات الدفع</a> : <Notice tone="warning" title="تعذر فتح صورة الإثبات" />}
                <DecisionForm row={row} action={reviewOrderPaymentProof} idField="order_id" idValue={orderId} />
              </article>;
            })}
          </div>
        </section>
      ) : null}

      {data.prescriptions.length > 0 ? (
        <section className="space-y-3">
          <div><h2 className="text-lg font-black">الروشتات الطبية</h2><p className="mt-1 text-xs font-semibold text-slate-500">راجع المرفق وتأكد أنه مناسب للطلب قبل الموافقة.</p></div>
          <div className="grid gap-4 xl:grid-cols-2">
            {data.prescriptions.map((row) => {
              const orderId = text(row, 'order_id');
              return <article key={text(row, 'id')} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black text-slate-400">الطلب المرتبط</p>{orderId ? <Link href={`/admin/now/orders/${orderId}`} className="mt-1 inline-flex items-center gap-1 font-black text-violet-700">فتح الطلب <ArrowLeft size={13} /></Link> : <p className="mt-1 text-sm font-black">لم يتم الربط بعد</p>}</div><FileCheck2 className="text-violet-600" size={21} /></div>
                <p className="mt-3 text-xs font-semibold text-slate-400">تم الرفع {formatDate(row.submitted_at ?? row.created_at)}</p>
                {row.signed_url ? <a href={row.signed_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-800"><ExternalLink size={14} /> مشاهدة الروشتة</a> : null}
                {orderId ? <DecisionForm row={row} action={reviewPrescription} idField="order_id" idValue={orderId} /> : null}
              </article>;
            })}
          </div>
        </section>
      ) : null}

      {data.ageVerificationOrders.length > 0 ? (
        <section className="space-y-3">
          <div><h2 className="text-lg font-black">التحقق من العمر / الهوية</h2><p className="mt-1 text-xs font-semibold text-slate-500">سجّل التحقق فقط بعد مشاهدة إثبات مناسب.</p></div>
          <div className="grid gap-4 xl:grid-cols-2">
            {data.ageVerificationOrders.map((row) => <article key={text(row, 'id')} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><Link href={`/admin/now/orders/${text(row, 'id')}`} className="font-black text-violet-700">{text(row, 'order_code')}</Link><p className="mt-2 text-sm font-black text-slate-800">{text(row, 'customer_name')}</p><p dir="ltr" className="mt-1 text-right text-xs font-semibold text-slate-400">{text(row, 'customer_phone')}</p></div><IdCard className="text-amber-600" size={22} /></div>
              <form action={verifyOrderAge} className="mt-4 border-t border-slate-100 pt-4"><input type="hidden" name="order_id" value={text(row, 'id')} /><label className="text-xs font-black text-slate-600">ملاحظة — اختيارية<textarea name="note" rows={2} className={`${textareaClass} min-h-20`} /></label><button type="submit" className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white hover:bg-violet-700">تم التحقق من الهوية</button></form>
            </article>)}
          </div>
        </section>
      ) : null}

      {data.servicePaymentProofs.length > 0 ? (
        <section className="space-y-3">
          <div><h2 className="text-lg font-black">إثباتات دفع الخدمات</h2><p className="mt-1 text-xs font-semibold text-slate-500">راجع التحويل الخاص بحجز الخدمة قبل الاعتماد.</p></div>
          <div className="grid gap-4 xl:grid-cols-2">
            {data.servicePaymentProofs.map((row) => <article key={text(row, 'id')} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between"><div><p className="text-[10px] font-black text-slate-400">حجز خدمة</p><p className="mt-1 text-sm font-black text-slate-800">{text(row, 'service_booking_id')}</p></div><p className="text-lg font-black">{amount(row)}</p></div>
              {row.signed_url ? <a href={row.signed_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-800"><ExternalLink size={14} /> مشاهدة إثبات الدفع</a> : null}
              <DecisionForm row={row} action={reviewServicePaymentProof} idField="booking_id" idValue={text(row, 'service_booking_id')} />
            </article>)}
          </div>
        </section>
      ) : null}

      {data.serviceBookings.length > 0 ? (
        <section className="space-y-3">
          <div><h2 className="text-lg font-black">متابعة حجوزات الخدمات</h2><p className="mt-1 text-xs font-semibold text-slate-500">دي مش مراجعة مستند؛ دي قائمة بالحجوزات النشطة المطلوب تحريكها للمرحلة التالية.</p></div>
          <div className="grid gap-4 xl:grid-cols-2">
            {data.serviceBookings.map((row) => {
              const status = text(row, 'status');
              const transitions = getAllowedServiceBookingTransitions(status);
              return <article key={text(row, 'id')} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div><p className="font-black text-violet-700">{text(row, 'booking_code')}</p><p className="mt-2 text-sm font-black text-slate-800">{text(row, 'package_name_ar')}</p><p className="mt-1 text-xs font-semibold text-slate-400">{text(row, 'customer_name')} · {text(row, 'customer_phone')}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{bookingLabels[status] ?? status}</span></div>
                {transitions.length > 0 ? <form action={transitionServiceBooking} className="mt-4 border-t border-slate-100 pt-4"><input type="hidden" name="booking_id" value={text(row, 'id')} /><label className="text-xs font-black text-slate-600">الخطوة التالية<select name="new_status" required className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold"><option value="">اختر...</option>{transitions.map((next) => <option key={next} value={next}>{bookingLabels[next] ?? next}</option>)}</select></label><label className="mt-3 block text-xs font-black text-slate-600">سبب الإلغاء — يظهر فقط عند اختيار الإلغاء<textarea name="cancellation_reason" rows={2} className={`${textareaClass} min-h-20`} /></label><button type="submit" className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white">تحديث حالة الحجز</button></form> : <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-black text-emerald-800">لا توجد خطوة أخرى متاحة.</div>}
              </article>;
            })}
          </div>
        </section>
      ) : null}

      {data.accountDeletionRequests.length > 0 ? (
        <section className="space-y-3">
          <div><h2 className="text-lg font-black text-rose-900">طلبات حذف الحساب</h2><p className="mt-1 text-xs font-semibold text-slate-500">إجراء حساس. ابدأ المعالجة أولًا، ثم أكمل الحذف بعد مراجعة نتيجة الفحص.</p></div>
          <div className="grid gap-4 xl:grid-cols-2">
            {data.accountDeletionRequests.map((row) => {
              const status = text(row, 'status');
              return <article key={text(row, 'id')} className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-slate-400">طلب حذف حساب</p><p className="mt-1 text-sm font-black text-slate-800">{text(row, 'user_id') || 'مستخدم مجهول'}</p></div><span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-800">{status === 'pending' ? 'جديد' : 'جاري المعالجة'}</span></div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="font-bold text-slate-400">تاريخ الطلب</p><p className="mt-1 font-black text-slate-700">{formatDate(row.requested_at)}</p></div><div><p className="font-bold text-slate-400">الموعد المستهدف</p><p className="mt-1 font-black text-slate-700">{formatDate(row.target_completion_at)}</p></div></div>
                {text(row, 'completion_blocked_reason') ? <Notice tone="warning" title="الإكمال متوقف">{text(row, 'completion_blocked_reason')}</Notice> : null}
                {status === 'pending' ? <form action={startAccountDeletion} className="mt-4"><input type="hidden" name="request_id" value={text(row, 'id')} /><button type="submit" className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white">بدء المعالجة والفحص</button></form> : <form action={completeAccountDeletion} className="mt-4 border-t border-rose-100 pt-4"><input type="hidden" name="request_id" value={text(row, 'id')} /><label className="text-xs font-black text-slate-600">ملاحظة الاحتفاظ بالبيانات — إن وجدت<textarea name="retention_note" rows={2} className={`${textareaClass} min-h-20`} /></label><button type="submit" className="mt-3 w-full rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white">إكمال حذف الحساب</button></form>}
              </article>;
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
