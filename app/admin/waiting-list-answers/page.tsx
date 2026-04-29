'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Squada_One } from 'next/font/google'
import {
  getWaitingListAnswersAction,
  updateWaitingListAnswerStatusAction,
  type WaitingListAnswer,
} from './actions'

const squadaOne = Squada_One({
  subsets: ['latin'],
  weight: '400',
})

const statusLabels: Record<string, string> = {
  active: 'Active',
  matched: 'Matched',
  paused: 'Paused',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

const statusClassNames: Record<string, string> = {
  active: 'status-active',
  matched: 'status-matched',
  paused: 'status-paused',
  cancelled: 'status-cancelled',
  expired: 'status-expired',
}

const scopeLabels: Record<string, string> = {
  any: 'Any place type',
  bed: 'Bed',
  entire_room: 'Entire room',
  entire_property: 'Entire property',
}

const roomTypeLabels: Record<string, string> = {
  any: 'Any room type',
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  quad: 'Quad',
  custom: 'Custom',
}

const genderLabels: Record<string, string> = {
  boys: 'Boys',
  girls: 'Girls',
}

function formatDate(value: string | null) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) {
    return '—'
  }

  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

function getBudgetText(answer: WaitingListAnswer) {
  if (answer.min_budget_egp && answer.max_budget_egp) {
    return `${formatMoney(answer.min_budget_egp)} - ${formatMoney(
      answer.max_budget_egp
    )}`
  }

  if (answer.min_budget_egp) {
    return `From ${formatMoney(answer.min_budget_egp)}`
  }

  if (answer.max_budget_egp) {
    return `Up to ${formatMoney(answer.max_budget_egp)}`
  }

  return '—'
}

export default function WaitingListAnswersPage() {
  const [answers, setAnswers] = useState<WaitingListAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [universityFilter, setUniversityFilter] = useState('all')

  async function loadAnswers() {
    setLoading(true)
    setErrorMessage('')

    try {
      const result = await getWaitingListAnswersAction()
      setAnswers(result)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل البيانات.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnswers()
  }, [])

  const cities = useMemo(() => {
    const uniqueCities = new Map<string, string>()

    answers.forEach((answer) => {
      const cityName = answer.city?.name_ar || answer.city?.name_en

      if (cityName) {
        uniqueCities.set(cityName, cityName)
      }
    })

    return Array.from(uniqueCities.values()).sort()
  }, [answers])

  const universities = useMemo(() => {
    const uniqueUniversities = new Map<string, string>()

    answers.forEach((answer) => {
      const universityName =
        answer.university?.name_ar || answer.university?.name_en

      if (universityName) {
        uniqueUniversities.set(universityName, universityName)
      }
    })

    return Array.from(uniqueUniversities.values()).sort()
  }, [answers])

  const filteredAnswers = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase()

    return answers.filter((answer) => {
      const cityName = answer.city?.name_ar || answer.city?.name_en || ''
      const universityName =
        answer.university?.name_ar || answer.university?.name_en || ''
      const collegeName =
        answer.college?.name_ar || answer.college?.name_en || ''

      const matchesSearch =
        !normalizedSearchQuery ||
        [
          answer.full_name,
          answer.phone,
          answer.email,
          answer.whatsapp,
          cityName,
          universityName,
          collegeName,
          answer.message,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearchQuery)

      const matchesStatus =
        statusFilter === 'all' || answer.status === statusFilter

      const matchesCity = cityFilter === 'all' || cityName === cityFilter

      const matchesUniversity =
        universityFilter === 'all' || universityName === universityFilter

      return matchesSearch && matchesStatus && matchesCity && matchesUniversity
    })
  }, [answers, searchQuery, statusFilter, cityFilter, universityFilter])

  const stats = useMemo(() => {
    const active = answers.filter((answer) => answer.status === 'active').length
    const matched = answers.filter((answer) => answer.status === 'matched').length
    const paused = answers.filter((answer) => answer.status === 'paused').length
    const totalMatches = answers.reduce(
      (total, answer) => total + (answer.matched_count || 0),
      0
    )

    return {
      total: answers.length,
      active,
      matched,
      paused,
      totalMatches,
    }
  }, [answers])

  async function handleStatusChange(
    answerId: string,
    status: 'active' | 'matched' | 'paused' | 'cancelled' | 'expired'
  ) {
    setUpdatingId(answerId)
    setErrorMessage('')

    try {
      await updateWaitingListAnswerStatusAction(answerId, status)

      setAnswers((currentAnswers) =>
        currentAnswers.map((answer) =>
          answer.id === answerId
            ? {
                ...answer,
                status,
                updated_at: new Date().toISOString(),
              }
            : answer
        )
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الحالة.'
      )
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-800">
      <header className="border-b border-gray-200 bg-[#f7f7f7] sticky top-0 z-40 shadow-sm h-20">
        <div className="mx-auto max-w-[1920px] px-4 h-full">
          <div className="flex items-center justify-center h-full">
            <Link
              href="/properties"
              className="flex items-center justify-center overflow-hidden h-full"
            >
              <img
                src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                alt="Logo"
                style={{
                  height: '180%',
                  width: 'auto',
                  objectFit: 'contain',
                  transform: 'scale(1)',
                  display: 'block',
                }}
              />
            </Link>
          </div>
        </div>
      </header>

      <section className="answers-hero">
        <div className="answers-hero-inner">
          <div>
            <p className="eyebrow">Student Housing Requests</p>
            <h1 className={`${squadaOne.className} hero-title`}>
              Waiting List Answers
            </h1>
            <p className="hero-description">
              Track students who need to change or find accommodation, review
              their city, university, budget, preferences and contact details.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnswers}
            className="refresh-button"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </section>

      <section className="dashboard-shell">
        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Requests</span>
            <strong>{stats.total}</strong>
          </div>

          <div className="stat-card">
            <span>Active</span>
            <strong>{stats.active}</strong>
          </div>

          <div className="stat-card">
            <span>Matched</span>
            <strong>{stats.matched}</strong>
          </div>

          <div className="stat-card">
            <span>Total Matches</span>
            <strong>{stats.totalMatches}</strong>
          </div>
        </div>

        <div className="filters-card">
          <input
            type="search"
            placeholder="Search by name, phone, email, university..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="matched">Matched</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
          >
            <option value="all">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            value={universityFilter}
            onChange={(event) => setUniversityFilter(event.target.value)}
          >
            <option value="all">All universities</option>
            {universities.map((university) => (
              <option key={university} value={university}>
                {university}
              </option>
            ))}
          </select>
        </div>

        {errorMessage && <div className="error-box">{errorMessage}</div>}

        {loading ? (
          <div className="empty-state">Loading waiting list answers...</div>
        ) : filteredAnswers.length === 0 ? (
          <div className="empty-state">
            No answers found for the selected filters.
          </div>
        ) : (
          <div className="answers-grid">
            {filteredAnswers.map((answer) => {
              const cityName = answer.city?.name_ar || answer.city?.name_en || '—'
              const universityName =
                answer.university?.name_ar || answer.university?.name_en || '—'
              const collegeName =
                answer.college?.name_ar || answer.college?.name_en || '—'

              return (
                <article key={answer.id} className="answer-card">
                  <div className="card-top">
                    <div>
                      <h2>{answer.full_name}</h2>
                      <p>{universityName}</p>
                    </div>

                    <span
                      className={`status-pill ${
                        statusClassNames[answer.status] || 'status-active'
                      }`}
                    >
                      {statusLabels[answer.status] || answer.status}
                    </span>
                  </div>

                  <div className="info-grid">
                    <div>
                      <span>City</span>
                      <strong>{cityName}</strong>
                    </div>

                    <div>
                      <span>College</span>
                      <strong>{collegeName}</strong>
                    </div>

                    <div>
                      <span>Gender</span>
                      <strong>
                        {answer.gender ? genderLabels[answer.gender] : '—'}
                      </strong>
                    </div>

                    <div>
                      <span>Budget</span>
                      <strong>{getBudgetText(answer)}</strong>
                    </div>

                    <div>
                      <span>Place Type</span>
                      <strong>
                        {answer.preferred_scope
                          ? scopeLabels[answer.preferred_scope] ||
                            answer.preferred_scope
                          : '—'}
                      </strong>
                    </div>

                    <div>
                      <span>Room Type</span>
                      <strong>
                        {answer.preferred_room_type
                          ? roomTypeLabels[answer.preferred_room_type] ||
                            answer.preferred_room_type
                          : '—'}
                      </strong>
                    </div>

                    <div>
                      <span>Matches</span>
                      <strong>{answer.matched_count}</strong>
                    </div>

                    <div>
                      <span>Created</span>
                      <strong>{formatDate(answer.created_at)}</strong>
                    </div>
                  </div>

                  {answer.message && (
                    <div className="message-box">
                      <span>Student Message</span>
                      <p>{answer.message}</p>
                    </div>
                  )}

                  <div className="contact-row">
                    {answer.phone && (
                      <a href={`tel:${answer.phone}`}>Call: {answer.phone}</a>
                    )}

                    {answer.whatsapp && (
                      <a
                        href={`https://wa.me/${answer.whatsapp.replace(
                          /\D/g,
                          ''
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    )}

                    {answer.email && (
                      <a href={`mailto:${answer.email}`}>{answer.email}</a>
                    )}
                  </div>

                  <div className="card-footer">
                    <select
                      value={answer.status}
                      disabled={updatingId === answer.id}
                      onChange={(event) =>
                        handleStatusChange(
                          answer.id,
                          event.target.value as
                            | 'active'
                            | 'matched'
                            | 'paused'
                            | 'cancelled'
                            | 'expired'
                        )
                      }
                    >
                      <option value="active">Active</option>
                      <option value="matched">Matched</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="expired">Expired</option>
                    </select>

                    <span>
                      Updated: <strong>{formatDate(answer.updated_at)}</strong>
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <style jsx>{`
        .answers-hero {
          background:
            radial-gradient(circle at top left, #dbeafe 0, transparent 34%),
            linear-gradient(135deg, #054aff 0%, #2563eb 48%, #1e40af 100%);
          color: white;
          padding: 72px 24px;
        }

        .answers-hero-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }

        .eyebrow {
          margin: 0 0 12px;
          font-size: 13px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 800;
          opacity: 0.85;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(48px, 7vw, 92px);
          line-height: 0.9;
          letter-spacing: -0.06em;
          text-transform: uppercase;
          font-weight: 500;
        }

        .hero-description {
          max-width: 680px;
          margin: 20px 0 0;
          font-size: 18px;
          line-height: 1.7;
          color: #e0ecff;
        }

        .refresh-button {
          border: 2px solid white;
          background: white;
          color: #054aff;
          height: 46px;
          padding: 0 24px;
          border-radius: 999px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 18px 45px rgb(15, 23, 42, 0.22);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .refresh-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 55px rgb(15, 23, 42, 0.28);
        }

        .refresh-button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .dashboard-shell {
          max-width: 1280px;
          margin: -38px auto 80px;
          padding: 0 24px;
          position: relative;
          z-index: 2;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 22px;
        }

        .stat-card {
          background: white;
          border: 1px solid #dbeafe;
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 18px 40px rgb(15, 23, 42, 0.08);
        }

        .stat-card span {
          display: block;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .stat-card strong {
          display: block;
          color: #054aff;
          font-size: 36px;
          line-height: 1;
          font-weight: 900;
        }

        .filters-card {
          background: white;
          border: 1px solid #dbeafe;
          border-radius: 24px;
          padding: 18px;
          box-shadow: 0 18px 40px rgb(15, 23, 42, 0.08);
          display: grid;
          grid-template-columns: minmax(240px, 1.4fr) repeat(3, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 22px;
        }

        .filters-card input,
        .filters-card select,
        .card-footer select {
          height: 46px;
          border: 2px solid #dbeafe;
          border-radius: 14px;
          padding: 0 14px;
          outline: none;
          color: #1e40af;
          background: #ffffff;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .filters-card input:focus,
        .filters-card select:focus,
        .card-footer select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgb(37, 99, 235, 0.1);
        }

        .answers-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .answer-card {
          background: white;
          border: 1px solid #dbeafe;
          border-radius: 28px;
          padding: 22px;
          box-shadow: 0 18px 40px rgb(15, 23, 42, 0.08);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .answer-card:hover {
          transform: translateY(-3px);
          border-color: #93c5fd;
          box-shadow: 0 24px 60px rgb(15, 23, 42, 0.12);
        }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .card-top h2 {
          margin: 0;
          color: #0f172a;
          font-size: 24px;
          line-height: 1.2;
          letter-spacing: -0.03em;
        }

        .card-top p {
          margin: 6px 0 0;
          color: #2563eb;
          font-weight: 800;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .status-active {
          color: #1d4ed8;
          background: #dbeafe;
        }

        .status-matched {
          color: #15803d;
          background: #dcfce7;
        }

        .status-paused {
          color: #a16207;
          background: #fef3c7;
        }

        .status-cancelled {
          color: #b91c1c;
          background: #fee2e2;
        }

        .status-expired {
          color: #475569;
          background: #e2e8f0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .info-grid div {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          min-height: 74px;
        }

        .info-grid span,
        .message-box span {
          display: block;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 7px;
        }

        .info-grid strong {
          display: block;
          color: #0f172a;
          font-size: 15px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .message-box {
          margin-top: 14px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 18px;
          padding: 15px;
        }

        .message-box p {
          margin: 0;
          color: #1e3a8a;
          line-height: 1.7;
          font-weight: 600;
        }

        .contact-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .contact-row a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          border-radius: 999px;
          padding: 0 14px;
          background: #054aff;
          color: white;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          transition: all 0.2s ease;
        }

        .contact-row a:hover {
          background: #1e40af;
          transform: translateY(-1px);
        }

        .card-footer {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .card-footer select {
          min-width: 150px;
        }

        .card-footer span {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .card-footer strong {
          color: #0f172a;
        }

        .error-box {
          background: #eff6ff;
          color: #1d4ed8;
          padding: 16px;
          border-radius: 18px;
          font-size: 14px;
          border: 1px solid #bfdbfe;
          text-align: center;
          margin-bottom: 20px;
          font-weight: 800;
        }

        .empty-state {
          background: white;
          border: 1px dashed #93c5fd;
          border-radius: 24px;
          padding: 44px 20px;
          text-align: center;
          color: #1e40af;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 18px 40px rgb(15, 23, 42, 0.06);
        }

        @media (max-width: 1024px) {
          .answers-hero-inner {
            flex-direction: column;
            align-items: flex-start;
          }

          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .filters-card {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .answers-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .answers-hero {
            padding: 52px 18px;
          }

          .dashboard-shell {
            padding: 0 16px;
          }

          .stats-grid,
          .filters-card,
          .info-grid {
            grid-template-columns: 1fr;
          }

          .hero-title {
            font-size: 46px;
          }

          .hero-description {
            font-size: 16px;
          }

          .card-top,
          .card-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .card-footer select {
            width: 100%;
          }
        }
      `}</style>
    </main>
  )
}