export default function OrdersLoading() {
  return (
    <div className="orders-operations space-y-4" aria-busy="true" aria-label="جاري تحميل الطلبات">
      <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
        <div className="space-y-3">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      </div>
      <p className="sr-only" role="status">جاري تحميل الطلبات…</p>
    </div>
  );
}
