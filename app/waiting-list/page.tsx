'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Squada_One } from 'next/font/google'
import WaitingListNotifications from './WaitingListNotifications'
import {
  completeWaitingListAction,
  getWaitingListOptionsAction,
} from './actions'

const squadaOne = Squada_One({
  subsets: ['latin'],
  weight: '400',
})

type CityOption = {
  id: string
  name_en: string
  name_ar: string
}

type UniversityOption = {
  id: string
  city_id: string
  name_en: string
  name_ar: string
}

type CollegeOption = {
  id: string
  university_id: string
  name_en: string
  name_ar: string | null
}

export default function WaitingListPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  const [cityId, setCityId] = useState('')
  const [universityId, setUniversityId] = useState('')
  const [collegeId, setCollegeId] = useState('')
  const [gender, setGender] = useState('')
  const [preferredRoomType, setPreferredRoomType] = useState('any')
  const [minBudgetEgp, setMinBudgetEgp] = useState('')
  const [maxBudgetEgp, setMaxBudgetEgp] = useState('')
  const [message, setMessage] = useState('')

  const [cities, setCities] = useState<CityOption[]>([])
  const [universities, setUniversities] = useState<UniversityOption[]>([])
  const [colleges, setColleges] = useState<CollegeOption[]>([])

  const [optionsLoading, setOptionsLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [waitingListRequestId, setWaitingListRequestId] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadOptions() {
      try {
        const result = await getWaitingListOptionsAction()

        if (!isMounted) {
          return
        }

        setCities(result.cities)
        setUniversities(result.universities)
        setColleges(result.colleges)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'حدث خطأ أثناء تحميل البيانات.'
        )
      } finally {
        if (isMounted) {
          setOptionsLoading(false)
        }
      }
    }

    loadOptions()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredUniversities = useMemo(() => {
    if (!cityId) {
      return []
    }

    return universities.filter((university) => university.city_id === cityId)
  }, [cityId, universities])

  const filteredColleges = useMemo(() => {
    if (!universityId) {
      return []
    }

    return colleges.filter((college) => college.university_id === universityId)
  }, [universityId, colleges])

  function handleCityChange(value: string) {
    setCityId(value)
    setUniversityId('')
    setCollegeId('')
  }

  function handleUniversityChange(value: string) {
    setUniversityId(value)
    setCollegeId('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    setWaitingListRequestId('')

    try {
      const result = await completeWaitingListAction({
        fullName,
        phone,
        whatsapp,
        email,
        cityId,
        universityId,
        collegeId,
        gender,
        preferredRoomType,
        minBudgetEgp,
        maxBudgetEgp,
        message,
      })

      setWaitingListRequestId(result.waitingListRequestId)

      setSuccessMessage(
        'تم إضافة طلبك لقائمة الانتظار بنجاح. فعّل الإشعارات عشان نبلغك أول ما يظهر سكن مناسب لجامعتك.'
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'
      )
    } finally {
      setLoading(false)
    }
  }

  const footerQuickLinks = [
    { label: 'من نحن', href: '/about' },
    { label: 'اللوحة', href: '/board' },
    { label: 'تواصل معنا', href: '/contact' },
  ]

  return (
    <main className="min-h-screen bg-white text-gray-700 relative" dir="rtl">
      <WaitingListNotifications waitingListRequestId={waitingListRequestId} />

      <header className="border-b border-gray-200 bg-[#f7f7f7] sticky top-0 md:static z-40 shadow-sm md:shadow-none h-20">
        <div className="mx-auto max-w-[1920px] px-4 h-full">
          <div className="flex items-center justify-center h-full">
            <Link
              href="/properties"
              className="flex items-center justify-center overflow-hidden h-full"
            >
              <img
                src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                alt="شعار Navienty"
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

      <section className="flex min-h-[calc(100vh-120px)] items-center justify-center px-6 py-10 bg-[#fcfcfd]">
        <div className="w-full flex justify-center">
          <form onSubmit={handleSubmit} className="form">
            <div id="signup-area">
              <p>قائمة الانتظار</p>
              <p id="behind">سجّل طلبك لإيجاد سكن مناسب</p>
            </div>

            <div id="fullName-area" className="input-area">
              <input
                placeholder="الاسم بالكامل"
                id="fullName"
                className="input"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>

            <div id="phone-area" className="input-area">
              <input
                placeholder="رقم الهاتف"
                id="phone"
                className="input"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>

            <div id="whatsapp-area" className="input-area">
              <input
                placeholder="رقم الواتساب"
                id="whatsapp"
                className="input"
                type="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
              />
            </div>

            <div id="email-area" className="input-area">
              <input
                placeholder="البريد الإلكتروني"
                id="email"
                className="input ltr-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div id="city-area" className="input-area">
              <select
                id="cityId"
                className="input"
                value={cityId}
                onChange={(event) => handleCityChange(event.target.value)}
                required
                disabled={optionsLoading}
              >
                <option value="">
                  {optionsLoading
                    ? 'جاري تحميل المحافظات...'
                    : 'اختر المحافظة / المدينة'}
                </option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name_ar || city.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div id="university-area" className="input-area">
              <select
                id="universityId"
                className="input"
                value={universityId}
                onChange={(event) => handleUniversityChange(event.target.value)}
                required
                disabled={!cityId || optionsLoading}
              >
                <option value="">اختر الجامعة</option>
                {filteredUniversities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name_ar || university.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div id="college-area" className="input-area">
              <select
                id="collegeId"
                className="input"
                value={collegeId}
                onChange={(event) => setCollegeId(event.target.value)}
                disabled={!universityId || optionsLoading}
              >
                <option value="">اختر الكلية - اختياري</option>
                {filteredColleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name_ar || college.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div id="gender-area" className="input-area">
              <select
                id="gender"
                className="input"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
              >
                <option value="">النوع - اختياري</option>
                <option value="boys">طلاب</option>
                <option value="girls">طالبات</option>
              </select>
            </div>

            <div id="room-area" className="input-area">
              <select
                id="preferredRoomType"
                className="input"
                value={preferredRoomType}
                onChange={(event) => setPreferredRoomType(event.target.value)}
              >
                <option value="any">أي نوع غرفة</option>
                <option value="single">غرفة فردية</option>
                <option value="double">غرفة ثنائية</option>
                <option value="triple">غرفة ثلاثية</option>
                <option value="quad">غرفة رباعية</option>
                <option value="custom">نوع آخر</option>
              </select>
            </div>

            <div id="budget-area" className="budget-row">
              <input
                placeholder="أقل ايجار للسرير"
                className="input"
                type="number"
                min="0"
                value={minBudgetEgp}
                onChange={(event) => setMinBudgetEgp(event.target.value)}
              />

              <input
                placeholder="أعلى ايجار للسرير"
                className="input"
                type="number"
                min="0"
                value={maxBudgetEgp}
                onChange={(event) => setMaxBudgetEgp(event.target.value)}
              />
            </div>

            <div id="message-area" className="message-area">
              <textarea
                placeholder="اكتب مشاكل السكن الحالي اللي بتواجها "
                id="message"
                className="input textarea"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
              />
            </div>

            <div id="footer-area">
              <button type="submit" disabled={loading || optionsLoading}>
                {loading ? 'جاري إرسال الطلب...' : 'إرسال الطلب'}
              </button>

              {errorMessage && <div className="error-box">{errorMessage}</div>}

              {successMessage && (
                <div className="success-box">{successMessage}</div>
              )}
            </div>

            <div id="background-color" />
          </form>
        </div>
      </section>

      <footer className="footer-esaf">
        <div className="footer-esaf-container">
          <div className="footer-esaf-top">
            <div className="footer-esaf-top-left">
              <h2 className={`${squadaOne.className} footer-esaf-title`}>
                طريقك لسكن طلابي أفضل
              </h2>
            </div>

            <div>
              <h3 className="footer-esaf-heading">روابط سريعة</h3>
              <div className="footer-esaf-links">
                {footerQuickLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="footer-esaf-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="footer-esaf-heading">تواصل معنا</h3>
              <a
                href="mailto:info@navienty.com"
                className="footer-esaf-email"
              >
                info@navienty.com
              </a>
            </div>
          </div>

          <div className="footer-esaf-bottom">
            <p className="footer-esaf-copyright">
              © {new Date().getFullYear()} Navienty | جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: white;
          width: clamp(21rem, 36vw, 28rem);
          min-height: 61.5rem;
          border: 2px solid #1e40af;
          border-bottom-left-radius: 1.8em;
          border-top-right-radius: 1.8em;
          box-shadow:
            -10px 0px 0px #1e40af,
            -10px 7px 10px rgb(0, 0, 0, 0.18);
          overflow: hidden;
          position: relative;
          transition: all 0.25s ease;
          padding-bottom: 0.8rem;
          direction: rtl;
        }

        #signup-area,
        .input-area,
        .budget-row,
        .message-area,
        #footer-area {
          position: relative;
          z-index: 2;
        }

        #signup-area {
          width: 100%;
          height: 4.8em;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          text-align: center;
        }

        #signup-area p {
          top: 0.45em;
          font-size: 1.55em;
          font-weight: bold;
          position: absolute;
          z-index: 2;
          margin: 0;
        }

        #signup-area #behind {
          top: 62%;
          font-size: 0.88em;
          font-weight: bold;
          position: absolute;
          z-index: 1;
        }

        #behind {
          position: absolute;
          right: 1.2em;
          color: #2563eb;
        }

        .input-area {
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          height: 5.25em;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          transition: all 0.25s ease;
        }

        #fullName-area {
          margin-top: 0.8em;
        }

        .input-area input,
        .input-area select,
        .budget-row input,
        .message-area textarea {
          width: 100%;
          border: 2px solid #2563eb;
          border-radius: 0.65em;
          height: 3em;
          padding-left: 1em;
          padding-right: 1em;
          font-size: 0.95rem;
          font-weight: 100;
          transition: all 0.5s ease;
          outline: none;
          box-shadow: 0px 5px 5px -3px rgb(0, 0, 0, 0.2);
          box-sizing: border-box;
          position: relative;
          z-index: 3;
          background: white;
          color: #2563eb;
          text-align: right;
          direction: rtl;
        }

        .ltr-input {
          direction: ltr !important;
          text-align: left !important;
        }

        .input-area select {
          cursor: pointer;
          font-weight: bold;
        }

        .budget-row {
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          height: 5.25em;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          align-items: center;
          transition: all 0.25s ease;
        }

        .message-area {
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          height: 7.2em;
          display: flex;
          align-items: center;
          transition: all 0.25s ease;
        }

        .textarea {
          min-height: 5.2em;
          resize: none;
          padding-top: 0.85em;
        }

        #footer-area {
          margin-top: 0%;
          padding-top: 0.6em;
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          min-height: 10.5em;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          color: #2563eb;
          transition: all 0.25s ease;
          text-align: center;
        }

        #footer-area button {
          width: 100%;
          border: 2px solid #2563eb;
          border-radius: 0.65em;
          height: 3em;
          padding-left: 1em;
          padding-right: 1em;
          font-size: 0.95rem;
          transition: all 0.25s ease;
          color: white;
          font-weight: bold;
          background-color: #2563eb;
          box-shadow: 0px 5px 5px -3px rgb(0, 0, 0, 0.2);
          cursor: pointer;
          box-sizing: border-box;
        }

        #footer-area button:disabled {
          cursor: not-allowed;
          opacity: 0.72;
        }

        #footer-area p,
        #footer-area a {
          font-size: 0.84em;
          transition: all 0.25s ease;
          margin: 0;
          text-decoration: none;
          color: inherit;
        }

        #text-inside {
          padding-top: 0.8em;
          width: 100%;
          text-align: center;
          line-height: 1.4;
          white-space: normal;
          overflow-wrap: break-word;
        }

        #link {
          font-weight: bold;
          display: inline;
        }

        #background-color {
          width: 100%;
          height: 4.8em;
          background-color: #2563eb;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
          transition:
            top 0.35s ease,
            height 0.35s ease;
          box-shadow: inset 5px 0px #1e40af;
          pointer-events: none;
        }

        #link-circle {
          width: 100%;
          height: 5em;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding-left: 15%;
          padding-right: 15%;
          margin-top: auto;
        }

        #link-circle svg {
          transition: all 0.25s ease;
        }

        ::placeholder {
          color: #2563eb;
          font-weight: bold;
        }

        .form:hover {
          width: clamp(21.3rem, 37vw, 28.5rem);
          min-height: 61.9rem;
        }

        #fullName-area:hover ~ #background-color {
          top: 5.6em;
          height: 5.25em;
        }

        #phone-area:hover ~ #background-color {
          top: 10.85em;
          height: 5.25em;
        }

        #whatsapp-area:hover ~ #background-color {
          top: 16.1em;
          height: 5.25em;
        }

        #email-area:hover ~ #background-color {
          top: 21.35em;
          height: 5.25em;
        }

        #city-area:hover ~ #background-color {
          top: 26.6em;
          height: 5.25em;
        }

        #university-area:hover ~ #background-color {
          top: 31.85em;
          height: 5.25em;
        }

        #college-area:hover ~ #background-color {
          top: 37.1em;
          height: 5.25em;
        }

        #gender-area:hover ~ #background-color {
          top: 42.35em;
          height: 5.25em;
        }

        #room-area:hover ~ #background-color {
          top: 47.6em;
          height: 5.25em;
        }

        #budget-area:hover ~ #background-color {
          top: 52.85em;
          height: 5.25em;
        }

        #message-area:hover ~ #background-color {
          top: 58.1em;
          height: 7.2em;
        }

        #footer-area:hover ~ #background-color {
          top: 65.3em;
          height: 10.5em;
        }

        .input-area:hover,
        .budget-row:hover,
        .message-area:hover,
        #footer-area:hover {
          padding-left: 7%;
          padding-right: 7%;
        }

        .input-area:hover input,
        .input-area:hover select,
        .budget-row:hover input,
        .message-area:hover textarea {
          color: white;
          border: 2px solid white;
          background-color: #2563eb;
          height: 3.2em;
        }

        .message-area:hover textarea {
          height: 5.4em;
        }

        .input-area:hover ::placeholder,
        .budget-row:hover ::placeholder,
        .message-area:hover ::placeholder {
          color: white;
        }

        #footer-area:hover p,
        #footer-area:hover a {
          color: white;
        }

        #footer-area:hover button {
          border: 2px solid white;
          background-color: #2563eb;
          height: 3.2em;
        }

        #footer-area button:active {
          color: #2563eb;
          background-color: white;
          width: 95%;
        }

        #link-circle svg:hover {
          transform: scale(1.15);
          margin: 0.3em;
        }

        .error-box {
          margin-top: 0.75em;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 0.75em 0.85em;
          border-radius: 0.6em;
          font-size: 0.8em;
          width: 100%;
          border: 1px solid #bfdbfe;
          text-align: center;
          box-sizing: border-box;
        }

        .success-box {
          margin-top: 0.75em;
          background: #f0fdf4;
          color: #15803d;
          padding: 0.75em 0.85em;
          border-radius: 0.6em;
          font-size: 0.8em;
          width: 100%;
          border: 1px solid #bbf7d0;
          text-align: center;
          box-sizing: border-box;
        }

        .footer-esaf {
          background: #054aff;
          color: #ffffff;
          margin-top: 56px;
          direction: rtl;
        }

        .footer-esaf-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 72px 48px 34px;
        }

        .footer-esaf-top {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) 320px 280px;
          gap: 72px;
          align-items: start;
        }

        .footer-esaf-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(42px, 5vw, 64px);
          line-height: 0.98;
          letter-spacing: -0.04em;
          font-weight: 500;
          text-transform: uppercase;
          text-align: right;
        }

        .footer-esaf-heading {
          margin: 0 0 18px;
          color: #ffffff;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .footer-esaf-links {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-esaf-link {
          display: inline-block;
          width: fit-content;
          color: #ffffff;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 8px;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }

        .footer-esaf-link:hover {
          opacity: 0.78;
        }

        .footer-esaf-email {
          display: inline-block;
          color: #ffffff;
          text-decoration: none;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 500;
          transition: opacity 0.2s ease;
          direction: ltr;
        }

        .footer-esaf-email:hover {
          opacity: 0.78;
        }

        .footer-esaf-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 34px;
          padding-top: 92px;
        }

        .footer-esaf-copyright {
          margin: 0;
          color: #ffffff;
          text-align: center;
          font-size: 16px;
          line-height: 1.5;
          letter-spacing: -0.02em;
        }

        @media (max-width: 1100px) {
          .footer-esaf-top {
            grid-template-columns: 1fr 1fr;
            gap: 48px 36px;
          }

          .footer-esaf-top-left {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 768px) {
          .footer-esaf-container {
            padding: 48px 22px 28px;
          }

          .footer-esaf-top {
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .footer-esaf-title {
            font-size: 36px;
          }

          .footer-esaf-heading {
            font-size: 22px;
            margin-bottom: 14px;
          }

          .footer-esaf-link,
          .footer-esaf-email {
            font-size: 17px;
          }

          .footer-esaf-bottom {
            padding-top: 56px;
            gap: 26px;
          }

          .footer-esaf-copyright {
            font-size: 14px;
          }
        }

        @media (max-width: 640px) {
          .form {
            width: min(91vw, 23rem);
            min-height: 61.5rem;
            box-shadow:
              -8px 0px 0px #1e40af,
              -8px 6px 10px rgb(0, 0, 0, 0.16);
          }

          .form:hover {
            width: min(91vw, 23rem);
            min-height: 61.5rem;
          }

          #signup-area p {
            font-size: 1.32em;
          }

          #signup-area #behind {
            font-size: 0.78em;
          }

          .budget-row {
            grid-template-columns: 1fr;
            height: 8.7em;
            gap: 0.55rem;
            align-content: center;
          }

          #budget-area:hover ~ #background-color {
            top: 52.85em;
            height: 8.7em;
          }

          #message-area:hover ~ #background-color {
            top: 61.55em;
            height: 7.2em;
          }

          #footer-area:hover ~ #background-color {
            top: 68.75em;
            height: 10.5em;
          }

          #text-inside {
            font-size: 0.82em;
          }
        }
      `}</style>
    </main>
  )
}