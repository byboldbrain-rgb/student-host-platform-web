import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireDepositRequestsAccess } from '@/src/lib/admin-auth'
import { createAdminClient } from '@/src/lib/supabase/admin'
import AdminLogoutButton from '@/app/admin/components/AdminLogoutButton'
import AdminDepositNotifications from './AdminDepositNotifications'
import {
  approveDepositRequestAction,
  rejectDepositRequestAction,
} from './actions'

function BrandLogo() {
  return (
    <Link
      href="/admin/finance/deposit-requests"
      className="navienty-logo"
      aria-label="Navienty admin home"
    >
      <img
        src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
        alt="Navienty icon"
        className="navienty-logo-icon"
      />
      <span className="navienty-logo-text-wrap">
        <img
          src="https://i.ibb.co/kVC7z9x7/Navienty-15.png"
          alt="Navienty"
          className="navienty-logo-text"
        />
      </span>
    </Link>
  )
}

function formatCurrency(amount: number | string | null) {
  const value = Number(amount || 0)
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div
        className={[
          'mt-1.5 break-words text-sm font-semibold text-slate-950',
          mono ? 'font-mono text-[13px] tracking-tight' : '',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  )
}

function TextInput({
  name,
  placeholder,
  required = false,
  defaultValue,
}: {
  name: string
  placeholder: string
  required?: boolean
  defaultValue?: string | null
}) {
  return (
    <input
      name={name}
      type="text"
      required={required}
      defaultValue={defaultValue || ''}
      placeholder={placeholder}
      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#054aff] focus:ring-4 focus:ring-[#054aff]/10"
    />
  )
}

function ActionButton({
  children,
  variant,
}: {
  children: ReactNode
  variant: 'approve' | 'reject'
}) {
  const className =
    variant === 'approve'
      ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/20'
      : 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600/20'

  return (
    <button
      type="submit"
      className={`inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-4 ${className}`}
    >
      {children}
    </button>
  )
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div>
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      ) : null}
    </div>
  )
}

function EmptyState() {
  return (
    <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-8 w-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.063 60.063 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A2.25 2.25 0 0 0 6 7.5h12a2.25 2.25 0 0 0 2.25-2.25V4.5m-16.5 0A2.25 2.25 0 0 1 6 2.25h12a2.25 2.25 0 0 1 2.25 2.25m-16.5 0h16.5M6.75 12h10.5m-10.5 3h6"
          />
        </svg>
      </div>

      <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
        No new deposit requests
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        New pending wallet deposit requests will appear here as soon as users
        submit their payment details.
      </p>
    </section>
  )
}

export default async function AdminDepositRequestsPage() {
  const adminContext = await requireDepositRequestsAccess()
  const supabase = createAdminClient()

  const { data: requests, error } = await supabase
    .from('wallet_deposit_requests')
    .select(`
      id,
      amount,
      payment_method,
      receipt_image_url,
      sender_name,
      sender_phone,
      transaction_reference,
      status,
      review_notes,
      reviewed_at,
      created_at,
      user_id
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const pendingRequestsCount = requests?.length ?? 0
  const notificationsEnabledForAdmin = adminContext.admin.role === 'AR'

  return (
    <>
      <style>{`
        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          overflow: visible;
          transform: none;
          margin-top: -10px;
        }

        .navienty-logo-icon {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .navienty-logo-text-wrap {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(-6px);
          transition:
            max-width 0.35s ease,
            opacity 0.25s ease,
            transform 0.35s ease;
          display: flex;
          align-items: center;
        }

        .navienty-logo:hover .navienty-logo-text-wrap,
        .navienty-logo:focus-visible .navienty-logo-text-wrap {
          max-width: 120px;
          opacity: 1;
          transform: translateX(0);
        }

        .navienty-logo-text {
          width: 112px;
          min-width: 112px;
          height: auto;
          object-fit: contain;
          display: block;
          transform: translateY(-2px);
        }

        .desktop-header-nav-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #20212a;
          text-decoration: none;
          font-size: 15px;
          line-height: 1;
          border: none;
          background: none;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          padding: 8px 0;
          transition: color 0.3s ease;
        }

        .desktop-header-nav-button::after,
        .desktop-header-nav-button::before {
          content: '';
          width: 0%;
          height: 2px;
          background: #000000;
          display: block;
          transition: 0.5s;
          position: absolute;
          left: 0;
        }

        .desktop-header-nav-button::before {
          top: 0;
        }

        .desktop-header-nav-button::after {
          bottom: 0;
        }

        .desktop-header-nav-button:hover::after,
        .desktop-header-nav-button:hover::before,
        .desktop-header-nav-button:focus-visible::after,
        .desktop-header-nav-button:focus-visible::before {
          width: 100%;
        }

        .desktop-header-nav-button-active {
          color: #054aff;
        }

        @media (max-width: 768px) {
          .navienty-logo {
            transform: none;
            margin-top: 0;
          }

          .navienty-logo-icon {
            width: 42px;
            height: 42px;
          }

          .navienty-logo-text-wrap {
            display: none;
          }

          .mobile-header-inner {
            justify-content: center !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff,_#f8fafc_45%,_#f8fafc_100%)] pb-8 text-slate-950">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin/finance/deposit-requests"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                Deposit Requests
              </Link>

              <AdminDepositNotifications
                enabled={notificationsEnabledForAdmin}
                initialPendingCount={pendingRequestsCount}
              />

              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-4 flex justify-end md:hidden">
            <AdminDepositNotifications
              enabled={notificationsEnabledForAdmin}
              initialPendingCount={pendingRequestsCount}
            />
          </div>

          {!requests || requests.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-5">
              {requests.map((request: any) => (
                <article
                  key={request.id}
                  className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]"
                >
                  <div className="pointer-events-none h-1 bg-gradient-to-r from-amber-500/12 via-transparent to-transparent" />

                  <div className="p-4 sm:p-5 lg:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <SectionHeader title="Payment Information" />
                      </div>

                      <div className="w-full rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-[0_8px_24px_rgba(37,99,235,0.08)] lg:w-auto lg:min-w-[230px]">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                          Amount
                        </p>
                        <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                          {formatCurrency(request.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                      <section>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <DetailItem
                            label="Payment Method"
                            value={request.payment_method || '-'}
                          />
                          <DetailItem
                            label="Sender Name"
                            value={request.sender_name || '-'}
                          />
                          <DetailItem
                            label="Sender Phone"
                            value={request.sender_phone || '-'}
                            mono
                          />
                          <DetailItem
                            label="Transaction Ref"
                            value={
                              request.transaction_reference ||
                              'Pending admin entry'
                            }
                            mono
                          />
                        </div>
                      </section>

                      <section>
                        <SectionHeader title="Receipt" />

                        {request.receipt_image_url ? (
                          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
                            <a
                              href={request.receipt_image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative block"
                            >
                              <img
                                src={request.receipt_image_url}
                                alt={`Deposit receipt ${request.id}`}
                                className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-64 lg:h-72"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent opacity-80" />

                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="inline-flex items-center rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg backdrop-blur">
                                  Open full receipt
                                </div>
                              </div>
                            </a>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-3xl border border-amber-100 bg-amber-50 p-5">
                            <div className="text-sm font-bold text-amber-950">
                              No receipt attached
                            </div>
                            <p className="mt-1 text-sm leading-6 text-amber-800/80">
                              Avoid approving this request until a clear proof
                              of payment is available.
                            </p>
                          </div>
                        )}
                      </section>
                    </div>

                    {request.review_notes ? (
                      <section className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                        <SectionHeader title="Review Notes" />
                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                          {request.review_notes}
                        </p>
                      </section>
                    ) : null}

                    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_150px] lg:items-end">
                        <form
                          id={`approve-${request.id}`}
                          action={approveDepositRequestAction}
                          className="contents"
                        >
                          <input
                            type="hidden"
                            name="deposit_request_id"
                            value={request.id}
                          />
                          <input type="hidden" name="review_notes" value="" />

                          <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Transaction Reference
                            </label>
                            <TextInput
                              name="transaction_reference"
                              placeholder="Enter transaction reference"
                              defaultValue={request.transaction_reference}
                              required
                            />
                          </div>

                          <ActionButton variant="approve">Approve</ActionButton>
                        </form>

                        <form action={rejectDepositRequestAction}>
                          <input
                            type="hidden"
                            name="deposit_request_id"
                            value={request.id}
                          />
                          <input
                            type="hidden"
                            name="review_notes"
                            value="Rejected by admin"
                          />

                          <ActionButton variant="reject">Reject</ActionButton>
                        </form>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}