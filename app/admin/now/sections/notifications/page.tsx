import {
  Activity,
  Bell,
  CheckCircle2,
  MousePointerClick,
  Percent,
  Send,
  Smartphone,
} from 'lucide-react';
import { redirect } from 'next/navigation';

import SubmitButton from '../../components/submit-button';
import { PageHeader } from '../../components/ui-kit';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { requireNowAdmin } from '../../lib/admin-data';
import { sendCustomerPushCampaignAction } from './actions';

type SearchParams = Record<string, string | string[] | undefined>;

type CampaignMetric = {
  day: string;
  notification_category: string;
  channel_id: string;
  campaign_id: string | null;
  outbox_count: number | string;
  processed_count: number | string;
  failed_count: number | string;
  provider_ticket_count: number | string;
  receipt_ok_count: number | string;
  receipt_error_count: number | string;
  opened_outbox_count: number | string;
  open_rate_pct: number | string | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  permission_denied: 'ليس لديك صلاحية إرسال إشعارات للعملاء.',
  invalid_title: 'اكتب عنوانًا من 1 إلى 100 حرف.',
  invalid_body: 'اكتب نصًا من 1 إلى 220 حرف.',
  invalid_category: 'نوع الإشعار غير صالح.',
  invalid_audience: 'الجمهور المحدد غير صالح.',
  invalid_destination: 'الوجهة داخل التطبيق غير مدعومة.',
  enqueue_failed: 'تعذر إضافة الإشعار إلى طابور الإرسال. حاول مرة أخرى.',
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function numberValue(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

async function countActiveSubscriptions(platform?: 'ios' | 'android') {
  const admin = createAdminClient();
  let query = admin
    .schema('now')
    .from('customer_push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  if (platform) query = query.eq('platform', platform);

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function loadNotificationDashboard() {
  const admin = createAdminClient();

  const [
    total,
    ios,
    android,
    pendingResult,
    sentResult,
    deliveredResult,
    openedResult,
    metricsResult,
  ] = await Promise.all([
    countActiveSubscriptions(),
    countActiveSubscriptions('ios'),
    countActiveSubscriptions('android'),
    admin
      .schema('now')
      .from('customer_notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('resource_type', 'campaign')
      .in('status', ['pending', 'processing']),
    admin
      .schema('now')
      .from('customer_notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('resource_type', 'campaign')
      .not('sent_at', 'is', null),
    admin
      .schema('now')
      .from('customer_notification_outbox')
      .select('id, customer_notification_tickets!inner(id)', { count: 'exact', head: true })
      .eq('resource_type', 'campaign')
      .eq('customer_notification_tickets.status', 'ok'),
    admin
      .schema('now')
      .from('customer_notification_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('resource_type', 'campaign')
      .not('first_opened_at', 'is', null),
    admin
      .schema('now')
      .from('notification_delivery_metrics_daily')
      .select(
        'day,notification_category,channel_id,campaign_id,outbox_count,processed_count,failed_count,provider_ticket_count,receipt_ok_count,receipt_error_count,opened_outbox_count,open_rate_pct',
      )
      .not('campaign_id', 'is', null)
      .order('day', { ascending: false })
      .limit(12),
  ]);

  if (pendingResult.error) throw new Error(pendingResult.error.message);
  if (sentResult.error) throw new Error(sentResult.error.message);
  if (deliveredResult.error) throw new Error(deliveredResult.error.message);
  if (openedResult.error) throw new Error(openedResult.error.message);
  if (metricsResult.error) throw new Error(metricsResult.error.message);

  const sentCount = sentResult.count ?? 0;
  const deliveredCount = deliveredResult.count ?? 0;
  const openedCount = openedResult.count ?? 0;
  const clickRate = deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0;

  return {
    total,
    ios,
    android,
    pending: pendingResult.count ?? 0,
    sentCount,
    deliveredCount,
    openedCount,
    clickRate,
    metrics: (metricsResult.data ?? []) as CampaignMetric[],
  };
}

function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#111827]">{value}</p>
          <p className="mt-1 text-[11px] font-medium text-gray-400">{helper}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-blue-50 text-blue-700">
          {icon}
        </span>
      </div>
    </div>
  );
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { access } = await requireNowAdmin();

  if (!access.permissions.manage_settings && access.platform_role !== 'super_admin') {
    redirect('/admin/unauthorized');
  }

  const params = await searchParams;
  const sent = Number(firstParam(params.sent));
  const campaign = firstParam(params.campaign);
  const errorCode = firstParam(params.error);
  const notice = firstParam(params.notice);
  const dashboard = await loadNotificationDashboard();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Navienty Now · Customer Push"
        title="إشعارات العملاء"
        description="اكتب الإشعار من لوحة الإدارة وسيصل إلى تطبيق Navienty Now عبر نفس نظام Expo Push الإنتاجي، مع احترام تفضيلات العميل وساعات الهدوء وتتبع الاستلام والفتح."
        icon={<Bell size={16} />}
      />

      {Number.isFinite(sent) && sent > 0 ? (
        <div className="flex items-start gap-3 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-emerald-900">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-sm font-black">تمت إضافة الإشعار لطابور الإرسال إلى {sent.toLocaleString('ar-EG')} عميل.</p>
            <p className="mt-1 text-xs font-medium text-emerald-700">
              {campaign ? `Campaign: ${campaign}` : 'سيقوم عامل الإرسال بمعالجته تلقائيًا.'}
            </p>
          </div>
        </div>
      ) : null}

      {notice === 'no_reachable_devices' ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm font-bold text-amber-900">
          لا توجد أجهزة نشطة مطابقة للجمهور المحدد حاليًا.
        </div>
      ) : null}

      {errorCode ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-bold text-rose-900">
          {ERROR_MESSAGES[errorCode] ?? 'تعذر إرسال الإشعار.'}
        </div>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-black text-[#111827]">أداء الـPush Notifications</h2>
          <p className="mt-1 text-xs font-medium text-gray-500">
            الأرقام تشمل حملات الـPush المرسلة من لوحة الإدارة وتتحدث تلقائيًا من بيانات الإرسال والاستلام والفتح.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="إشعارات اتبعتت"
            value={dashboard.sentCount.toLocaleString('ar-EG')}
            helper="خرجت من الـOutbox وتم إرسالها للمزوّد"
            icon={<Send size={19} />}
          />
          <StatCard
            label="عملاء استلموها"
            value={dashboard.deliveredCount.toLocaleString('ar-EG')}
            helper="Delivery Receipt ناجح من Expo / APNs / FCM"
            icon={<CheckCircle2 size={19} />}
          />
          <StatCard
            label="عملاء ضغطوا عليها"
            value={dashboard.openedCount.toLocaleString('ar-EG')}
            helper="تم تسجيل فتح الإشعار داخل التطبيق"
            icon={<MousePointerClick size={19} />}
          />
          <StatCard
            label="معدل الضغط"
            value={`${dashboard.clickRate.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}%`}
            helper="الضغطات ÷ الإشعارات التي تم تسليمها"
            icon={<Percent size={19} />}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="أجهزة نشطة"
          value={dashboard.total.toLocaleString('ar-EG')}
          helper="Push tokens جاهزة للاستقبال"
          icon={<Smartphone size={19} />}
        />
        <StatCard
          label="iOS"
          value={dashboard.ios.toLocaleString('ar-EG')}
          helper="أجهزة Apple النشطة"
          icon={<Smartphone size={19} />}
        />
        <StatCard
          label="Android"
          value={dashboard.android.toLocaleString('ar-EG')}
          helper="أجهزة Android النشطة"
          icon={<Smartphone size={19} />}
        />
        <StatCard
          label="قيد المعالجة"
          value={dashboard.pending.toLocaleString('ar-EG')}
          helper="رسائل Campaign pending/processing"
          icon={<Activity size={19} />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <form
          action={sendCustomerPushCampaignAction}
          className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)] md:p-6"
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h2 className="text-xl font-black text-[#111827]">إرسال Push Notification</h2>
              <p className="mt-1 text-xs font-medium leading-5 text-gray-500">الإرسال يبدأ فورًا بعد الضغط على الزر. لا يتم تجاوز تفضيلات الإشعارات الخاصة بالعميل.</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-violet-50 text-violet-700">
              <Send size={19} />
            </span>
          </div>

          <div className="mt-5 grid gap-5">
            <label className="grid gap-2">
              <span className="text-xs font-black text-gray-700">العنوان</span>
              <input
                name="title"
                required
                maxLength={100}
                placeholder="مثال: العرض اللي مستنيه وصل 👀"
                className="min-h-[48px] rounded-[16px] border border-gray-200 bg-[#fbfcfd] px-4 text-sm font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
              <span className="text-[10px] font-medium text-gray-400">حد أقصى 100 حرف</span>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black text-gray-700">نص الإشعار</span>
              <textarea
                name="body"
                required
                maxLength={220}
                rows={4}
                placeholder="اكتب الرسالة التي ستظهر للعميل على شاشة الهاتف."
                className="resize-none rounded-[16px] border border-gray-200 bg-[#fbfcfd] px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
              <span className="text-[10px] font-medium text-gray-400">حد أقصى 220 حرف</span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-black text-gray-700">الجمهور</span>
                <select
                  name="audience"
                  defaultValue="all"
                  className="min-h-[48px] rounded-[16px] border border-gray-200 bg-[#fbfcfd] px-4 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white"
                >
                  <option value="all">كل الأجهزة النشطة ({dashboard.total.toLocaleString('ar-EG')})</option>
                  <option value="ios">iOS فقط ({dashboard.ios.toLocaleString('ar-EG')})</option>
                  <option value="android">Android فقط ({dashboard.android.toLocaleString('ar-EG')})</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-gray-700">نوع الإشعار</span>
                <select
                  name="category"
                  defaultValue="general"
                  className="min-h-[48px] rounded-[16px] border border-gray-200 bg-[#fbfcfd] px-4 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white"
                >
                  <option value="general">عام</option>
                  <option value="offers">عروض ومميزات</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-xs font-black text-gray-700">يفتح العميل على</span>
              <select
                name="url"
                defaultValue="/"
                className="min-h-[48px] rounded-[16px] border border-gray-200 bg-[#fbfcfd] px-4 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white"
              >
                <option value="/">الرئيسية</option>
                <option value="/category/restaurants">المطاعم</option>
                <option value="/category/supermarket">السوبر ماركت</option>
                <option value="/category/bookstore">المكتبة</option>
                <option value="/category/personal-care">العناية الشخصية</option>
                <option value="/category/laundry">الغسيل والكي</option>
                <option value="/category/request-anything">اطلب أي حاجة</option>
                <option value="/orders">طلباتي</option>
                <option value="/account">الحساب</option>
              </select>
              <span className="text-[10px] font-medium text-gray-400">عند ضغط العميل على الإشعار سيفتح التطبيق مباشرة على الصفحة المختارة.</span>
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
            <p className="max-w-lg text-[11px] font-medium leading-5 text-gray-400">
              الإشعار يمر عبر Customer Notification Outbox ثم Expo Push. الأجهزة غير الصالحة يتم تعطيلها تلقائيًا بعد فشل provider receipt.
            </p>
            <SubmitButton
              idleText="إرسال الآن"
              pendingText="جاري الإضافة للطابور..."
              className="shrink-0 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] hover:bg-blue-700"
            />
          </div>
        </form>

        <div className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)] md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#111827]">آخر حملات Push</h2>
              <p className="mt-1 text-xs font-medium text-gray-500">لكل حملة: اتبعتت لكام عميل، وصلت لكام عميل، وكام عميل ضغط عليها.</p>
            </div>
            <Activity size={18} className="text-gray-400" />
          </div>

          <div className="mt-5 space-y-3">
            {dashboard.metrics.length ? (
              dashboard.metrics.map((metric) => {
                const processed = numberValue(metric.processed_count);
                const failed = numberValue(metric.failed_count);
                const receipts = numberValue(metric.receipt_ok_count);
                const opens = numberValue(metric.opened_outbox_count);
                const openRate = numberValue(metric.open_rate_pct);

                return (
                  <div
                    key={`${metric.campaign_id}-${metric.day}-${metric.notification_category}`}
                    className="rounded-[18px] border border-gray-100 bg-[#fbfcfd] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-gray-800">
                          {metric.notification_category === 'offers' ? 'عروض' : 'عام'} · {metric.campaign_id?.slice(0, 8)}
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-gray-400">{formatDate(metric.day)}</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-gray-600 shadow-sm">
                        {numberValue(metric.outbox_count).toLocaleString('ar-EG')} مستهدف
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-xl bg-white px-2 py-2">
                        <p className="text-[10px] font-semibold text-gray-400">اتبعتت</p>
                        <p className="mt-1 text-xs font-black text-gray-800">{processed.toLocaleString('ar-EG')}</p>
                      </div>
                      <div className="rounded-xl bg-white px-2 py-2">
                        <p className="text-[10px] font-semibold text-gray-400">وصلت</p>
                        <p className="mt-1 text-xs font-black text-gray-800">{receipts.toLocaleString('ar-EG')}</p>
                      </div>
                      <div className="rounded-xl bg-white px-2 py-2">
                        <p className="text-[10px] font-semibold text-gray-400">ضغطوا</p>
                        <p className="mt-1 text-xs font-black text-gray-800">{opens.toLocaleString('ar-EG')}</p>
                      </div>
                      <div className="rounded-xl bg-white px-2 py-2">
                        <p className="text-[10px] font-semibold text-gray-400">فشلت</p>
                        <p className="mt-1 text-xs font-black text-gray-800">{failed.toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold text-gray-400">
                      معدل الضغط: {openRate.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}%
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[18px] border border-dashed border-gray-200 px-4 py-10 text-center">
                <p className="text-sm font-bold text-gray-500">لا توجد Campaigns يدوية حتى الآن.</p>
                <p className="mt-1 text-xs font-medium text-gray-400">أول إرسال من الشاشة دي هيظهر هنا بعد معالجة الـworker.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
