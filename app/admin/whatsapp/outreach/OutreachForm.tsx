'use client'

import { FormEvent, useState, useTransition } from 'react'
import { createOutreachPreviewAction } from './actions'

type OutreachPreviewRow = {
  rowNumber: number
  phone: string
  normalizedPhone: string | null
  ownerName: string | null
  areaName: string | null
  areaSlug: string | null
  status: 'ready' | 'skipped'
  skippedReason: string | null
}

type OutreachPreviewResult = {
  ok: boolean
  campaignId?: string
  summary?: {
    totalRows: number
    readyCount: number
    skippedCount: number
    invalidCount: number
    duplicateInBatchCount: number
    alreadyContactedCount: number
  }
  rows?: OutreachPreviewRow[]
  error?: string
}

const sampleInput = `phone,owner_name,area_name,area_slug
01123456789,أحمد,أسيوط الجديدة,asyut-new
01098765432,محمود,الوليدية,el-walidia`

function getSkippedReasonLabel(reason: string | null) {
  if (reason === 'invalid_phone') return 'رقم غير صحيح'
  if (reason === 'duplicate_in_current_batch') return 'مكرر في نفس القائمة'
  if (reason === 'already_contacted_before') return 'تم التواصل معه قبل كده'

  return reason || '—'
}

export default function OutreachForm() {
  const [rows, setRows] = useState(sampleInput)
  const [campaignName, setCampaignName] = useState('')
  const [templateName, setTemplateName] = useState('owner_onboarding_intro')
  const [templateLanguage, setTemplateLanguage] = useState('ar_EG')
  const [result, setResult] = useState<OutreachPreviewResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData()
    formData.set('rows', rows)
    formData.set('campaignName', campaignName)
    formData.set('templateName', templateName)
    formData.set('templateLanguage', templateLanguage)

    startTransition(async () => {
      const response = await createOutreachPreviewAction(formData)
      setResult(response)
    })
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="rounded-3xl border bg-white p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Campaign name
            </label>
            <input
              value={campaignName}
              onChange={(event) => setCampaignName(event.target.value)}
              placeholder="Owner outreach - today"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Template name
            </label>
            <input
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Template language
            </label>
            <input
              value={templateLanguage}
              onChange={(event) => setTemplateLanguage(event.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium">Owners CSV</label>

          <textarea
            value={rows}
            onChange={(event) => setRows(event.target.value)}
            rows={12}
            className="w-full resize-y rounded-2xl border p-4 font-mono text-sm outline-none focus:border-black"
            placeholder="phone,owner_name,area_name,area_slug"
          />

          <p className="mt-2 text-xs text-gray-500">
            Format: phone, owner_name, area_name, area_slug
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? 'Checking...' : 'Preview campaign'}
          </button>
        </div>
      </form>

      {result ? (
        <section className="rounded-3xl border bg-white p-5">
          {!result.ok ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              {result.error || 'Something went wrong.'}
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-xl font-semibold">Preview result</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Campaign ID: {result.campaignId}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-5">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Total rows</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {result.summary?.totalRows || 0}
                  </div>
                </div>

                <div className="rounded-2xl bg-green-50 p-4">
                  <div className="text-xs text-green-700">Ready</div>
                  <div className="mt-1 text-2xl font-semibold text-green-700">
                    {result.summary?.readyCount || 0}
                  </div>
                </div>

                <div className="rounded-2xl bg-yellow-50 p-4">
                  <div className="text-xs text-yellow-700">Skipped</div>
                  <div className="mt-1 text-2xl font-semibold text-yellow-700">
                    {result.summary?.skippedCount || 0}
                  </div>
                </div>

                <div className="rounded-2xl bg-red-50 p-4">
                  <div className="text-xs text-red-700">Invalid</div>
                  <div className="mt-1 text-2xl font-semibold text-red-700">
                    {result.summary?.invalidCount || 0}
                  </div>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4">
                  <div className="text-xs text-blue-700">Already contacted</div>
                  <div className="mt-1 text-2xl font-semibold text-blue-700">
                    {result.summary?.alreadyContactedCount || 0}
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="p-3">Row</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Owner</th>
                      <th className="p-3">Area</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Reason</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(result.rows || []).map((row) => (
                      <tr key={row.rowNumber} className="border-t">
                        <td className="p-3">{row.rowNumber}</td>
                        <td className="p-3">
                          <div>{row.phone}</div>
                          <div className="text-xs text-gray-500">
                            {row.normalizedPhone || '—'}
                          </div>
                        </td>
                        <td className="p-3">{row.ownerName || '—'}</td>
                        <td className="p-3">{row.areaName || '—'}</td>
                        <td className="p-3">{row.areaSlug || '—'}</td>
                        <td className="p-3">
                          <span
                            className={[
                              'rounded-full px-3 py-1 text-xs font-medium',
                              row.status === 'ready'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-yellow-50 text-yellow-700',
                            ].join(' ')}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600">
                          {getSkippedReasonLabel(row.skippedReason)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-sm text-gray-500">
                الإرسال الفعلي هنضيفه في الخطوة اللي بعدها بعد ما نتأكد إن الـ
                preview شغال صح.
              </p>
            </>
          )}
        </section>
      ) : null}
    </div>
  )
}