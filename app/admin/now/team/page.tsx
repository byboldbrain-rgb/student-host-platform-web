import { UserPlus, UsersRound } from 'lucide-react';

import { createAdminClient } from '@/src/lib/supabase/admin';

import { inputClass, Notice, PageHeader } from '../components/ui-kit';
import { requireNowTableAccess } from '../lib/table-data';
import { addNowTeamMember, removeNowTeamMember, updateNowTeamMember } from './actions';

type Member = {
  user_id: string;
  role: string;
  can_view_orders: boolean;
  can_manage_orders: boolean;
  can_manage_catalog: boolean;
  can_manage_finance: boolean;
  can_manage_settings: boolean;
  is_active: boolean;
};

type PlatformAdmin = { id: string; email: string | null; full_name: string | null; role: string | null; is_active: boolean | null };

const roleOptions = [
  ['operations', 'تشغيل الطلبات'],
  ['customer_support', 'خدمة العملاء'],
  ['catalog_manager', 'إدارة المتاجر والمنتجات'],
  ['finance', 'المالية والدفع'],
  ['viewer', 'مشاهدة فقط'],
] as const;

function roleLabel(role: string) {
  return roleOptions.find(([value]) => value === role)?.[1] ?? role;
}

function Permission({ name, label, defaultChecked = false }: { name: string; label: string; defaultChecked?: boolean }) {
  return <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-violet-600" />{label}</label>;
}

export default async function NowTeamPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const [{ access }, params] = await Promise.all([requireNowTableAccess('admin_members', true), searchParams]);
  const admin = createAdminClient();
  const [membersResult, platformResult] = await Promise.all([
    admin.schema('now').from('admin_members').select('user_id,role,can_view_orders,can_manage_orders,can_manage_catalog,can_manage_finance,can_manage_settings,is_active').order('created_at', { ascending: true }),
    admin.from('admin_users').select('id,email,full_name,role,is_active').order('full_name', { ascending: true }),
  ]);
  if (membersResult.error) throw new Error(membersResult.error.message);
  if (platformResult.error) throw new Error(platformResult.error.message);
  const members = (membersResult.data ?? []) as Member[];
  const platformAdmins = (platformResult.data ?? []) as PlatformAdmin[];
  const profileMap = new Map(platformAdmins.map((profile) => [profile.id, profile]));
  const memberIds = new Set(members.map((member) => member.user_id));
  const candidates = platformAdmins.filter((profile) => profile.is_active !== false && !memberIds.has(profile.id));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="إدارة الفريق" title="فريق Navienty Now" description="أضف الموظفين وحدد بالضبط الأقسام التي يمكن لكل شخص مشاهدتها أو إدارتها. لا تحتاج لنسخ أي User ID." icon={<UsersRound size={16} />} actions={<span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">{members.length.toLocaleString('ar-EG')} عضو</span>} />
      {params.success ? <Notice tone="success" title={params.success} /> : null}
      {params.error ? <Notice tone="warning" title="تعذر تنفيذ العملية">{params.error}</Notice> : null}

      <details className="group rounded-2xl border border-emerald-200 bg-white shadow-sm" open={members.length === 0}>
        <summary className="flex cursor-pointer list-none items-center justify-between p-5"><span className="flex items-center gap-2 font-black text-emerald-800"><UserPlus size={18} /> إضافة موظف</span><span className="text-xs font-bold text-slate-400">{candidates.length} حساب متاح</span></summary>
        <form action={addNowTeamMember} className="border-t border-emerald-100 p-5">
          {candidates.length === 0 ? <Notice tone="info" title="لا توجد حسابات إدارة جديدة متاحة">أنشئ حساب Admin في لوحة Navienty الرئيسية أولًا، وبعدها سيظهر هنا للاختيار.</Notice> : <>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="text-xs font-black text-slate-700">الموظف<select name="user_id" required className={inputClass}><option value="">اختر الموظف...</option>{candidates.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || profile.email || 'حساب Admin'}{profile.email && profile.full_name ? ` — ${profile.email}` : ''}</option>)}</select></label>
              <label className="text-xs font-black text-slate-700">الدور الوظيفي<select name="role" required defaultValue="operations" className={inputClass}>{roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            <p className="mt-5 text-xs font-black text-slate-600">الصلاحيات</p><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><Permission name="can_view_orders" label="مشاهدة الطلبات" defaultChecked /><Permission name="can_manage_orders" label="إدارة الطلبات" /><Permission name="can_manage_catalog" label="المتاجر والمنتجات" /><Permission name="can_manage_finance" label="الدفع والمالية" /><Permission name="can_manage_settings" label="إعدادات النظام" /></div>
            <div className="mt-5 flex justify-end"><button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700">إضافة للفريق</button></div>
          </>}
        </form>
      </details>

      <section className="space-y-3">
        {members.map((member) => {
          const profile = profileMap.get(member.user_id);
          const isSelf = member.user_id === access.user_id;
          return <details key={member.user_id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <summary className="cursor-pointer list-none p-5 hover:bg-slate-50"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-slate-900">{profile?.full_name || profile?.email || 'عضو إدارة'}</h2>{isSelf ? <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-700">أنت</span> : null}{!member.is_active ? <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700">موقوف</span> : null}</div>{profile?.email ? <p dir="ltr" className="mt-1 text-right text-xs font-semibold text-slate-400">{profile.email}</p> : null}</div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{roleLabel(member.role)}</span></div></summary>
            <form action={updateNowTeamMember} className="border-t border-slate-100 p-5"><input type="hidden" name="user_id" value={member.user_id} /><div className="grid gap-4 lg:grid-cols-2"><label className="text-xs font-black text-slate-700">الدور الوظيفي<select name="role" defaultValue={member.role} className={inputClass}>{roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700"><input type="checkbox" name="is_active" defaultChecked={member.is_active} className="h-4 w-4 accent-violet-600" />الحساب نشط داخل Now</label></div><p className="mt-5 text-xs font-black text-slate-600">الصلاحيات</p><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><Permission name="can_view_orders" label="مشاهدة الطلبات" defaultChecked={member.can_view_orders} /><Permission name="can_manage_orders" label="إدارة الطلبات" defaultChecked={member.can_manage_orders} /><Permission name="can_manage_catalog" label="المتاجر والمنتجات" defaultChecked={member.can_manage_catalog} /><Permission name="can_manage_finance" label="الدفع والمالية" defaultChecked={member.can_manage_finance} /><Permission name="can_manage_settings" label="إعدادات النظام" defaultChecked={member.can_manage_settings} /></div><div className="mt-5 flex flex-wrap justify-between gap-2"><div>{!isSelf ? <button formAction={removeNowTeamMember} type="submit" className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50">إزالة من الفريق</button> : null}</div><button type="submit" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-700">حفظ الصلاحيات</button></div></form>
          </details>;
        })}
      </section>
    </div>
  );
}
