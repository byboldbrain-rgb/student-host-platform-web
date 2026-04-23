'use client'

import { useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createWalletDepositRequestWithUploadAction } from './actions'

type PaymentMethodItem = {
  id: number
  code: string
  name_ar: string
  name_en: string
  instructions_ar: string | null
  instructions_en: string | null
  active_account: {
    id: number
    label: string | null
    account_name: string | null
    account_number: string | null
    iban: string | null
    qr_image_url: string | null
  } | null
}

type Props = {
  paymentMethods: PaymentMethodItem[]
}

const KNOWN_PROVIDER_LOGOS: Record<string, string> = {
  vodafone_cash: 'https://i.ibb.co/B5B9FZwL/Vodafone-cambia-ecco-nuovo-logo-e-claim-jpg.webp',
  orange_cash: 'https://i.ibb.co/27fg29QT/Navienty-18.png',
  etisalat_cash: 'https://i.ibb.co/Fk4035wS/channels4-profile.jpg',
  instapay: 'https://i.ibb.co/0pGB01br/images-3.png',
  bank_transfer: 'https://i.ibb.co/DffZ4Sfs/Navienty-19.png',
  bank: 'https://i.ibb.co/DffZ4Sfs/Navienty-19.png',
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, ' ')
}

function resolveProviderLogoPath(method: PaymentMethodItem) {
  const code = method.code.trim().toLowerCase()
  const arName = normalizeText(method.name_ar)
  const enName = normalizeText(method.name_en)

  if (KNOWN_PROVIDER_LOGOS[code]) return KNOWN_PROVIDER_LOGOS[code]

  if (arName.includes('فودافون') || enName.includes('vodafone')) {
    return 'https://i.ibb.co/B5B9FZwL/Vodafone-cambia-ecco-nuovo-logo-e-claim-jpg.webp'
  }

  if (arName.includes('أورنج') || arName.includes('اورنج') || enName.includes('orange')) {
    return 'https://i.ibb.co/zh6M9VZH/Navienty-17.png'
  }

  if (arName.includes('اتصالات') || enName.includes('etisalat')) {
    return 'https://i.ibb.co/Fk4035wS/channels4-profile.jpg'
  }

  if (arName.includes('انستا') || enName.includes('instapay')) {
    return 'https://i.ibb.co/0pGB01br/images-3.png'
  }

  if (arName.includes('بنك') || enName.includes('bank') || enName.includes('transfer')) {
    return 'https://i.ibb.co/27NQL9XL/WE.jpg'
  }

  return ''
}

function buildFallbackLogo(name: string) {
  const safeName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="28" fill="url(#g)"/>
      <rect x="18" y="18" width="284" height="164" rx="22" fill="#ffffff" stroke="#dbe3ee"/>
      <circle cx="64" cy="100" r="24" fill="#0f172a"/>
      <text x="64" y="108" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">₿</text>
      <text x="176" y="102" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a">${safeName}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function InputField({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  inputMode,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <div>
      <label className="mb-2.5 block text-[13px] font-bold text-slate-800">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
      />
    </div>
  )
}

function TransferInfoRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-slate-100 py-4 last:border-b-0 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center sm:gap-4 sm:py-5">
      <div className="text-[14px] font-semibold text-slate-500">{label}</div>
      <div
        dir={mono ? 'ltr' : undefined}
        className={`text-[15px] font-bold text-slate-950 text-left sm:text-left sm:text-[17px] ${mono ? 'font-mono tracking-wide' : ''}`}
      >
        {value}
      </div>
    </div>
  )
}

function FinalSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className="btn-12 min-w-[220px] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span>{pending ? 'Sending...' : 'Add Balance'}</span>
      </button>

      <style jsx>{`
        .btn-12,
        .btn-12 *,
        .btn-12:after,
        .btn-12:before,
        .btn-12 *:after,
        .btn-12 *:before {
          border: 0 solid;
          box-sizing: border-box;
        }

        .btn-12 {
          -webkit-tap-highlight-color: transparent;
          -webkit-appearance: button;
          appearance: button;
          background-color: #2563eb;
          background-image: none;
          color: #ffffff;
          cursor: pointer;
          font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            'Helvetica Neue',
            Arial,
            'Noto Sans',
            sans-serif,
            'Apple Color Emoji',
            'Segoe UI Emoji',
            'Segoe UI Symbol',
            'Noto Color Emoji';
          font-size: 100%;
          font-weight: 900;
          line-height: 1.5;
          margin: 0;
          -webkit-mask-image: -webkit-radial-gradient(#000, #fff);
          padding: 0.8rem 3rem;
          text-transform: uppercase;
          border-radius: 9999px;
          border-width: 2px;
          border-style: solid;
          border-color: #2563eb;
          overflow: hidden;
          position: relative;
          isolation: isolate;
          transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            transform 0.2s ease;
        }

        .btn-12:hover {
          background-color: #ffffff;
          border-color: #2563eb;
          transform: translateY(-1px);
        }

        .btn-12:disabled {
          cursor: default;
        }

        .btn-12:-moz-focusring {
          outline: auto;
        }

        .btn-12 svg {
          display: block;
          vertical-align: middle;
        }

        .btn-12 [hidden] {
          display: none;
        }

        .btn-12 span {
          color: #ffffff;
          position: relative;
          z-index: 2;
          transition: color 0.25s ease;
        }

        .btn-12:hover span {
          color: #2563eb;
        }

        .btn-12:before,
        .btn-12:after {
          content: '';
          inset: 0;
          position: absolute;
          transform: translateY(var(--progress, 100%));
          transition: transform 0.2s ease;
          z-index: 1;
          pointer-events: none;
        }

        .btn-12:before {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.12) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.12) 50%,
            rgba(255, 255, 255, 0.12) 75%,
            transparent 75%
          );
        }

        .btn-12:after {
          --progress: -100%;
          background: linear-gradient(
            90deg,
            transparent 0,
            transparent 25%,
            rgba(255, 255, 255, 0.18) 25%,
            rgba(255, 255, 255, 0.18) 50%,
            transparent 50%,
            transparent 75%,
            rgba(255, 255, 255, 0.18) 75%
          );
        }

        .btn-12:hover:before {
          background: linear-gradient(
            90deg,
            rgba(37, 99, 235, 0.08) 25%,
            transparent 25%,
            transparent 50%,
            rgba(37, 99, 235, 0.08) 50%,
            rgba(37, 99, 235, 0.08) 75%,
            transparent 75%
          );
        }

        .btn-12:hover:after {
          background: linear-gradient(
            90deg,
            transparent 0,
            transparent 25%,
            rgba(37, 99, 235, 0.12) 25%,
            rgba(37, 99, 235, 0.12) 50%,
            transparent 50%,
            transparent 75%,
            rgba(37, 99, 235, 0.12) 75%
          );
        }

        .btn-12:hover:before,
        .btn-12:hover:after {
          --progress: 0;
        }
      `}</style>
    </>
  )
}

export default function WalletDepositForm({ paymentMethods }: Props) {
  const [selectedCode, setSelectedCode] = useState('')
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [receiptFileName, setReceiptFileName] = useState('')

  const selectedMethod = useMemo(
    () => paymentMethods.find((method) => method.code === selectedCode) ?? null,
    [paymentMethods, selectedCode]
  )

  const activeAccount = selectedMethod?.active_account ?? null

  const selectedLogo = selectedMethod
    ? imageErrors[selectedMethod.code] || !resolveProviderLogoPath(selectedMethod)
      ? buildFallbackLogo(selectedMethod.name_en)
      : resolveProviderLogoPath(selectedMethod)
    : null

  return (
    <form action={createWalletDepositRequestWithUploadAction} className="w-full space-y-6">
      <input type="hidden" name="payment_method" value={selectedCode} required />
      <input type="hidden" name="payment_method_account_id" value={activeAccount?.id ?? ''} />

      <div className="w-full">
        <div className="w-full space-y-6">
          <section className="w-full rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:rounded-[32px] sm:p-6">
            <h3 className="mt-2 text-[22px] font-black tracking-tight text-slate-950 sm:text-[25px]">
              Choose Payment Method
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
              {paymentMethods.map((method) => {
                const isSelected = selectedCode === method.code
                const providerLogo = resolveProviderLogoPath(method)
                const fallbackLogo = buildFallbackLogo(method.name_en)
                const imageSrc =
                  imageErrors[method.code] || !providerLogo ? fallbackLogo : providerLogo

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedCode(method.code)}
                    aria-pressed={isSelected}
                    aria-label={method.name_en}
                    title={method.name_en}
                    className={[
                      'group relative overflow-hidden rounded-[22px] border-2 p-2 transition-all duration-300 sm:rounded-[30px] sm:p-3',
                      'focus:outline-none focus:ring-0',
                      isSelected
                        ? 'border-blue-600 bg-white shadow-none ring-2 ring-blue-100'
                        : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'overflow-hidden rounded-[18px] border transition sm:rounded-[24px]',
                        isSelected ? 'border-blue-200 bg-white' : 'border-slate-100 bg-slate-50',
                      ].join(' ')}
                    >
                      <div className="flex h-[92px] w-full items-center justify-center overflow-hidden bg-white p-4 sm:h-[170px] sm:p-4">
                        <img
                          src={imageSrc}
                          alt={method.name_en}
                          className="max-h-[52px] w-auto max-w-full object-contain sm:h-full sm:w-full sm:max-h-none sm:object-cover"
                          onError={() =>
                            setImageErrors((prev) => ({
                              ...prev,
                              [method.code]: true,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {selectedMethod ? (
            activeAccount ? (
              <section className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:rounded-[32px]">
                <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-6 sm:py-5">
                  <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-[22px] font-black tracking-tight text-slate-950 sm:text-[25px]">
                        Transfer Details
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="mx-auto max-w-4xl rounded-[22px] border border-slate-200 bg-white px-4 sm:rounded-[28px] sm:px-5">
                    {activeAccount.account_name ? (
                      <TransferInfoRow label="Recipient Name" value={activeAccount.account_name} />
                    ) : null}
                    {activeAccount.account_number ? (
                      <TransferInfoRow
                        label="Transfer Number"
                        value={activeAccount.account_number}
                        mono
                      />
                    ) : null}
                    {activeAccount.iban ? (
                      <TransferInfoRow label="IBAN" value={activeAccount.iban} mono />
                    ) : null}
                  </div>
                </div>
              </section>
            ) : (
              <section className="w-full rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-[0_10px_30px_rgba(245,158,11,0.08)] sm:rounded-[32px] sm:p-6">
                <div className="text-base font-black">This method is currently unavailable</div>
                <p className="mt-2 text-sm leading-7">
                  There are no receiving details linked to this method at the moment. Please choose
                  another payment method.
                </p>
              </section>
            )
          ) : null}

          <section className="w-full rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:rounded-[32px] sm:p-6">
            <h3 className="mt-2 text-[22px] font-black tracking-tight text-slate-950 sm:text-[25px]">
              Sender Details
            </h3>

            <div className="mt-5 grid gap-4 sm:mt-6 md:grid-cols-2">
              <InputField
                label="Amount"
                name="amount"
                type="number"
                placeholder="Enter amount"
                required
                inputMode="decimal"
              />

              <InputField
                label="Phone Number"
                name="sender_phone"
                placeholder="01xxxxxxxxx"
                inputMode="tel"
              />

              <InputField
                label="Sender Name"
                name="sender_name"
                placeholder="Account or wallet holder name"
              />
            </div>
          </section>

          <section className="w-full rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:rounded-[32px] sm:p-6">
            <h3 className="mt-2 text-[22px] font-black tracking-tight text-slate-950 sm:text-[25px]">
              Upload Receipt
            </h3>

            <div className="mt-6 flex justify-center">
              <div className="w-full max-w-[420px] rounded-[20px] border border-[rgb(159,159,160)] bg-white px-3 pb-3 pt-8 text-center shadow-[0_10px_60px_rgb(218,229,255)]">
                <span className="block text-[1.8rem] font-medium text-black">
                  Upload your file
                </span>

                <p className="mt-[10px] text-[0.9375rem] text-[rgb(105,105,105)]">
                  File should be an image
                </p>

                <label
                  htmlFor="receipt_file"
                  className="mt-[2.1875rem] flex cursor-pointer flex-col items-center justify-center gap-[10px] rounded-[10px] border-2 border-dashed border-[rgb(171,202,255)] bg-white p-[10px] text-[#444] transition hover:border-[rgba(17,17,17,0.616)] hover:bg-[rgba(0,140,255,0.164)]"
                >
                  <span className="text-[20px] font-bold text-[#444] transition hover:text-[#222]">
                    Drop files here
                  </span>

                  <span className="text-sm text-slate-600">or</span>

                  <input
                    id="receipt_file"
                    name="receipt_file"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    required
                    onChange={(e) => setReceiptFileName(e.target.files?.[0]?.name ?? '')}
                    className="block w-full max-w-full rounded-[10px] border border-[rgba(8,8,8,0.288)] bg-white p-[2px] text-[#444] file:ml-5 file:cursor-pointer file:rounded-[10px] file:border-none file:bg-[#084cdf] file:px-5 file:py-2.5 file:text-white file:transition hover:file:bg-[#0d45a5]"
                  />
                </label>

                <p className="mt-4 text-sm text-slate-500">
                  Allowed formats: PNG, JPG, JPEG, WEBP
                </p>

                {receiptFileName ? (
                  <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                    Selected file: {receiptFileName}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <div className="flex justify-center pt-2">
            <FinalSubmitButton />
          </div>
        </div>
      </div>
    </form>
  )
}