import Link from 'next/link';
import {
  BadgeCheck,
  Banknote,
  CalendarClock,
  ExternalLink,
  FileCheck2,
  IdCard,
  ShieldAlert,
  Trash2,
} from 'lucide-react';

import { getNowReviewCenterData, type ReviewQueueRow } from '../lib/review-data';
import { getAllowedServiceBookingTransitions } from '../lib/workflows';
import {
  completeAccountDeletion,
  reviewOrderPaymentProof,
  reviewPrescription,
  reviewServicePaymentProof,
  startAccountDeletion,
  transitionServiceBooking,
  verifyOrderAge,
} from './actions';

function text(row: Record<string, unknown>, key: string, fallback = '—') {
  const value = row[key];
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

function date(value: unknown) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Cairo',
      }).format(parsed);
}

function EvidenceLink({ row, label }: { row: ReviewQueueRow; label: string }) {
  if (!row.signed_url) {
    return (
      <span className="text-xs font-bold text-rose-600">
        تعذر إنشاء رابط آمن للملف
      </span>
    );
  }

  return (
    <a
      href={row.signed_url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100"
    >
      <ExternalLink size={14} />
      {label}
    </a>
  );
}

function EmptyQueue() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
      لا توجد عناصر تنتظر المراجعة.
    </div>
  );
}

export default async function NavientyNowReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const query = await searchParams;
  const data = await getNowReviewCenterData();
  const operationCount =
    data.orderPaymentProofs.length +
    data.prescriptions.length +
    data.ageVerificationOrders.length +
    data.servicePaymentProofs.length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
              <ShieldAlert size={14} />
              Safe Workflows
            </div>
            <h2 className="text-2xl font-black sm:text-3xl">مركز المراجعات والتشغيل</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              العمليات هنا تستخدم RPCs وقواعد الانتقال الموجودة في قاعدة البيانات بدل تعديل
              السجلات الحساسة مباشرة. يشمل الدفع، الروشتات، التحقق العمري، حجوزات الخدمات وحذف
              الحساب.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-2xl font-black">{operationCount}</p>
            <p className="text-xs font-bold text-slate-300">مراجعات تشغيلية معلقة</p>
          </div>
        </div>
      </section>

      {query.success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800">
          {query.success}
        </div>
      ) : null}

      {query.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-800">
          {query.error}
        </div>
      ) : null}

      {data.access.permissions.manage_orders ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Banknote className="text-emerald-600" size={21} />
              <div>
                <h3 className="font-black">إثباتات دفع الطلبات</h3>
                <p className="text-xs text-slate-500">{data.orderPaymentProofs.length} في انتظار القرار</p>
              </div>
            </div>

            <div className="space-y-3">
              {data.orderPaymentProofs.map((row) => {
                const orderId = text(row, 'order_id', '');
                return (
                  <div key={text(row, 'id')} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">طلب: {orderId || 'غير مرتبط'}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {text(row, 'amount_snapshot')} {text(row, 'currency_code_snapshot')} · {date(row.created_at)}
                        </p>
                      </div>
                      <EvidenceLink row={row} label="فتح إثبات الدفع" />
                    </div>

                    {orderId ? (
                      <form action={reviewOrderPaymentProof} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                        <input type="hidden" name="order_id" value={orderId} />
                        <input
                          name="note"
                          placeholder="ملاحظة المراجعة — اختياري"
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                        />
                        <button
                          name="decision"
                          value="approved"
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white"
                        >
                          اعتماد
                        </button>
                        <button
                          name="decision"
                          value="rejected"
                          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white"
                        >
                          رفض
                        </button>
                      </form>
                    ) : null}
                  </div>
                );
              })}
              {data.orderPaymentProofs.length === 0 ? <EmptyQueue /> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <FileCheck2 className="text-violet-600" size={21} />
              <div>
                <h3 className="font-black">مراجعة الروشتات</h3>
                <p className="text-xs text-slate-500">{data.prescriptions.length} روشتة معلقة</p>
              </div>
            </div>

            <div className="space-y-3">
              {data.prescriptions.map((row) => {
                const orderId = text(row, 'order_id', '');
                return (
                  <div key={text(row, 'id')} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">طلب: {orderId || 'لم تُربط بطلب بعد'}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Store: {text(row, 'store_id')} · {date(row.submitted_at ?? row.created_at)}
                        </p>
                      </div>
                      <EvidenceLink row={row} label="فتح الروشتة" />
                    </div>

                    {orderId ? (
                      <form action={reviewPrescription} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                        <input type="hidden" name="order_id" value={orderId} />
                        <input
                          name="note"
                          placeholder="ملاحظة للصيدلية/الطلب — اختياري"
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                        />
                        <button
                          name="decision"
                          value="approved"
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white"
                        >
                          اعتماد
                        </button>
                        <button
                          name="decision"
                          value="rejected"
                          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white"
                        >
                          رفض
                        </button>
                      </form>
                    ) : null}
                  </div>
                );
              })}
              {data.prescriptions.length === 0 ? <EmptyQueue /> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <IdCard className="text-blue-600" size={21} />
              <div>
                <h3 className="font-black">التحقق من العمر / الهوية</h3>
                <p className="text-xs text-slate-500">{data.ageVerificationOrders.length} طلب يحتاج تحقق</p>
              </div>
            </div>

            <div className="space-y-3">
              {data.ageVerificationOrders.map((row) => {
                const orderId = text(row, 'id', '');
                return (
                  <div key={orderId} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <p className="font-black">
                          {text(row, 'order_code')} · {text(row, 'customer_name')}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {text(row, 'customer_phone')} · {text(row, 'store_name_ar_snapshot')}
                        </p>
                      </div>
                      <Link
                        href={`/admin/now/orders/${orderId}`}
                        className="text-xs font-black text-violet-700"
                      >
                        فتح الطلب
                      </Link>
                    </div>
                    <form action={verifyOrderAge} className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input type="hidden" name="order_id" value={orderId} />
                      <input
                        name="note"
                        placeholder="ملاحظة التحقق — اختياري"
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                      />
                      <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
                        <BadgeCheck size={16} />
                        تم التحقق
                      </button>
                    </form>
                  </div>
                );
              })}
              {data.ageVerificationOrders.length === 0 ? <EmptyQueue /> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Banknote className="text-cyan-600" size={21} />
              <div>
                <h3 className="font-black">إثباتات دفع حجوزات الخدمات</h3>
                <p className="text-xs text-slate-500">{data.servicePaymentProofs.length} معلقة</p>
              </div>
            </div>
            <div className="space-y-3">
              {data.servicePaymentProofs.map((row) => {
                const bookingId = text(row, 'service_booking_id', '');
                return (
                  <div key={text(row, 'id')} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">Booking: {bookingId}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {text(row, 'amount_snapshot')} {text(row, 'currency_code_snapshot')} · {date(row.created_at)}
                        </p>
                      </div>
                      <EvidenceLink row={row} label="فتح إثبات الدفع" />
                    </div>
                    <form action={reviewServicePaymentProof} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                      <input type="hidden" name="booking_id" value={bookingId} />
                      <input
                        name="note"
                        placeholder="ملاحظة المراجعة — اختياري"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                      />
                      <button name="decision" value="approved" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">
                        اعتماد
                      </button>
                      <button name="decision" value="rejected" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white">
                        رفض
                      </button>
                    </form>
                  </div>
                );
              })}
              {data.servicePaymentProofs.length === 0 ? <EmptyQueue /> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <CalendarClock className="text-orange-600" size={21} />
              <div>
                <h3 className="font-black">تشغيل حجوزات الخدمات</h3>
                <p className="text-xs text-slate-500">{data.serviceBookings.length} حجز نشط</p>
              </div>
            </div>
            <div className="space-y-3">
              {data.serviceBookings.map((row) => {
                const bookingId = text(row, 'id', '');
                const currentStatus = text(row, 'status', '');
                const transitions = getAllowedServiceBookingTransitions(currentStatus);
                return (
                  <div key={bookingId} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">
                          {text(row, 'booking_code')} · {text(row, 'package_name_ar')}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {text(row, 'customer_name')} · {text(row, 'customer_phone')} · {text(row, 'address')}
                        </p>
                      </div>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">
                        {currentStatus}
                      </span>
                    </div>
                    {transitions.length > 0 ? (
                      <form action={transitionServiceBooking} className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
                        <input type="hidden" name="booking_id" value={bookingId} />
                        <select
                          name="new_status"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
                          required
                          defaultValue=""
                        >
                          <option value="" disabled>اختر الحالة التالية</option>
                          {transitions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <input
                          name="cancellation_reason"
                          placeholder="سبب الإلغاء عند اختيار cancelled"
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                        />
                        <button className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-black text-white">
                          تحديث الحالة
                        </button>
                      </form>
                    ) : null}
                  </div>
                );
              })}
              {data.serviceBookings.length === 0 ? <EmptyQueue /> : null}
            </div>
          </section>
        </>
      ) : null}

      {data.access.permissions.manage_settings ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Trash2 className="text-rose-600" size={21} />
            <div>
              <h3 className="font-black">طلبات حذف الحساب</h3>
              <p className="text-xs text-slate-500">{data.accountDeletionRequests.length} طلب مفتوح</p>
            </div>
          </div>

          <div className="space-y-3">
            {data.accountDeletionRequests.map((row) => {
              const requestId = text(row, 'id', '');
              const status = text(row, 'status', '');
              return (
                <div key={requestId} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black">User: {text(row, 'user_id', 'تم حذف auth user')}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Requested: {date(row.requested_at)} · Target: {date(row.target_completion_at)}
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800">
                      {status}
                    </span>
                  </div>

                  {row.completion_blocked_reason ? (
                    <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800">
                      Blocked: {text(row, 'completion_blocked_reason')}
                    </p>
                  ) : null}

                  {status === 'pending' ? (
                    <form action={startAccountDeletion} className="mt-4">
                      <input type="hidden" name="request_id" value={requestId} />
                      <button className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white">
                        بدء المعالجة + Preflight
                      </button>
                    </form>
                  ) : null}

                  {status === 'processing' ? (
                    <form action={completeAccountDeletion} className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input type="hidden" name="request_id" value={requestId} />
                      <input
                        name="retention_note"
                        placeholder="ملاحظة البيانات المحتفظ بها — اختياري"
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
                      />
                      <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
                        إكمال الطلب
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}
            {data.accountDeletionRequests.length === 0 ? <EmptyQueue /> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
