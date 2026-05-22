'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUpUserAction } from './actions'

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await signUpUserAction({
        fullName,
        phone,
        email,
        password,
        referralCode: '',
      })

      setSuccessMessage('تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.')

      setTimeout(() => {
        router.push('/login')
        router.refresh()
      }, 1200)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-white pb-32 text-gray-700 dark:bg-[#050816] dark:text-slate-100 md:pb-0">
      <header className="sticky top-0 z-40 h-20 border-b border-gray-200 bg-[#f7f7f7] shadow-sm dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)] md:static md:shadow-none">
        <div className="mx-auto h-full max-w-[1920px] px-4">
          <div className="flex h-full items-center justify-center">
            <Link
              href="/properties"
              className="flex h-full items-center justify-center overflow-hidden"
            >
              <img
                src="https://i.ibb.co/FLsWDBr6/Untitled.png"
                alt="Logo"
                style={{
                  height: '90%',
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

      <section className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-[#fcfcfd] px-6 py-10 dark:bg-[#050816]">
        <div className="flex w-full justify-center">
          <form onSubmit={handleSubmit} className="form">
            <div id="signup-area">
              <p>SIGN UP</p>
              <p id="behind">Create your account</p>
            </div>

            <div id="fullName-area" className="input-area">
              <input
                placeholder="FULL NAME"
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
                placeholder="PHONE NUMBER"
                id="phone"
                className="input"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>

            <div id="email-area" className="input-area">
              <input
                placeholder="EMAIL"
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div id="password-area" className="input-area">
              <input
                placeholder="PASSWORD"
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>

            <div id="footer-area">
              <button type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              {errorMessage && <div className="error-box">{errorMessage}</div>}

              {successMessage && (
                <div className="success-box">{successMessage}</div>
              )}

              <p id="text-inside">
                Already have an account?{' '}
                <Link href="/login" id="link">
                  Log In
                </Link>
              </p>
            </div>

            <div id="background-color" />

            <div id="link-circle">
              <a
                href="https://www.facebook.com/navienty"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={35}
                  height={35}
                  viewBox="0 0 24 24"
                  fill="#2563eb"
                >
                  <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm4 7.278V4.5h-2.286c-2.1 0-3.428 1.6-3.428 3.889v1.667H8v2.777h2.286V19.5h2.857v-6.667h2.286L16 10.056h-2.857V8.944c0-1.11.572-1.666 1.714-1.666H16z" />
                </svg>
              </a>

              <a
                href="https://www.instagram.com/navienty"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={35}
                  height={35}
                  viewBox="0 0 24 24"
                  fill="#2563eb"
                >
                  <path d="M12 0c6.6274 0 12 5.3726 12 12s-5.3726 12-12 12S0 18.6274 0 12 5.3726 0 12 0zm3.115 4.5h-6.23c-2.5536 0-4.281 1.6524-4.3805 4.1552L4.5 8.8851v6.1996c0 1.3004.4234 2.4193 1.2702 3.2359.7582.73 1.751 1.1212 2.8818 1.1734l.2633.006h6.1694c1.3004 0 2.389-.4234 3.1754-1.1794.762-.734 1.1817-1.7576 1.2343-2.948l.0056-.2577V8.8851c0-1.2702-.4234-2.3589-1.2097-3.1452-.7338-.762-1.7575-1.1817-2.9234-1.2343l-.252-.0056zM8.9152 5.8911h6.2299c.9072 0 1.6633.2722 2.2076.8166.4713.499.7647 1.1758.8103 1.9607l.0063.2167v6.2298c0 .9375-.3327 1.6936-.877 2.2077-.499.4713-1.176.7392-1.984.7806l-.2237.0057H8.9153c-.9072 0-1.6633-.2722-2.2076-.7863-.499-.499-.7693-1.1759-.8109-2.0073l-.0057-.2306V8.885c0-.9073.2722-1.6633.8166-2.2077.4712-.4713 1.1712-.7392 1.9834-.7806l.2242-.0057h6.2299-6.2299zM12 8.0988c-2.117 0-3.871 1.7238-3.871 3.871A3.8591 3.8591 0 0 0 12 15.8408c2.1472 0 3.871-1.7541 3.871-3.871 0-2.117-1.754-3.871-3.871-3.871zm0 1.3911c1.3609 0 2.4798 1.119 2.4798 2.4799 0 1.3608-1.119 2.4798-2.4798 2.4798-1.3609 0-2.4798-1.119-2.4798-2.4798 0-1.361 1.119-2.4799 2.4798-2.4799zm4.0222-2.3589a.877.877 0 1 0 0 1.754.877.877 0 0 0 0-1.754z" />
                </svg>
              </a>

              <a
                href="https://www.linkedin.com/company/navienty/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={35}
                  height={35}
                  viewBox="0 0 24 24"
                  fill="#2563eb"
                >
                  <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zM8.951 9.404H6.165V17.5H8.95V9.404zm6.841-.192c-1.324 0-1.993.629-2.385 1.156l-.127.181V9.403h-2.786l.01.484c.006.636.007 1.748.005 2.93l-.015 4.683h2.786v-4.522c0-.242.018-.484.092-.657.202-.483.66-.984 1.43-.984.955 0 1.367.666 1.408 1.662l.003.168V17.5H19v-4.643c0-2.487-1.375-3.645-3.208-3.645zM7.576 5.5C6.623 5.5 6 6.105 6 6.899c0 .73.536 1.325 1.378 1.392l.18.006c.971 0 1.577-.621 1.577-1.398C9.116 6.105 8.53 5.5 7.576 5.5z" />
                </svg>
              </a>
            </div>
          </form>
        </div>
      </section>

      <nav
        className="mobile-bottom-nav"
        aria-label="Mobile bottom navigation"
        dir="ltr"
      >
        <div className="mobile-bottom-nav__inner">
          <Link
            href="/properties"
            className="mobile-bottom-nav__item mobile-bottom-nav__item--search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.9}
              stroke="currentColor"
              className="mobile-bottom-nav__icon"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 16l4 4" />
            </svg>
            <span className="mobile-bottom-nav__label">Search</span>
          </Link>

          <Link
            href="/community"
            className="mobile-bottom-nav__item mobile-bottom-nav__item--community"
          >
            <img
              src="https://i.ibb.co/fzNcyyxw/community-3010762.png"
              alt="Community"
              className="mobile-bottom-nav__icon mobile-bottom-nav__icon--image"
              draggable={false}
            />
            <span className="mobile-bottom-nav__label">Community</span>
          </Link>

          <Link
            href="/signup"
            className="mobile-bottom-nav__item mobile-bottom-nav__item--account mobile-bottom-nav__item--active"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.9}
              stroke="currentColor"
              className="mobile-bottom-nav__icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.125a7.5 7.5 0 0 1 15 0"
              />
            </svg>
            <span className="mobile-bottom-nav__label">Sign up</span>
          </Link>
        </div>
      </nav>

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: white;
          width: clamp(20rem, 32vw, 25rem);
          min-height: 34rem;
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
        }

        #signup-area,
        .input-area,
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
        }

        #signup-area p {
          top: 0.45em;
          font-size: 1.7em;
          font-weight: bold;
          position: absolute;
          z-index: 2;
          margin: 0;
          transition: color 0.25s ease;
        }

        #signup-area #behind {
          top: 62%;
          font-size: 0.95em;
          font-weight: bold;
          position: absolute;
          z-index: 1;
          transition: color 0.25s ease;
        }

        #behind {
          position: absolute;
          left: 1.2em;
          color: #2563eb;
        }

        .input-area {
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          height: 5.7em;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          transition: all 0.25s ease;
        }

        #fullName-area {
          margin-top: 0.8em;
        }

        .input-area input {
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
        }

        #footer-area button {
          width: 100%;
          border: 2px solid #2563eb;
          border-radius: 0.65em;
          height: 3em;
          padding-left: 1em;
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
          opacity: 0.75;
          cursor: not-allowed;
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
          width: clamp(20.3rem, 33vw, 25.5rem);
          min-height: 34.4rem;
        }

        #fullName-area:hover ~ #background-color {
          top: 5.6em;
          height: 5.7em;
        }

        #phone-area:hover ~ #background-color {
          top: 11.3em;
          height: 5.7em;
        }

        #email-area:hover ~ #background-color {
          top: 17em;
          height: 5.7em;
        }

        #password-area:hover ~ #background-color {
          top: 22.7em;
          height: 5.7em;
        }

        #footer-area:hover ~ #background-color {
          top: 28.4em;
          height: 10.5em;
        }

        .input-area:hover,
        #footer-area:hover {
          padding-left: 7%;
          padding-right: 7%;
        }

        .input-area:hover input {
          color: white;
          border: 2px solid white;
          background-color: #2563eb;
          height: 3.2em;
        }

        .input-area:hover ::placeholder {
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

        .mobile-bottom-nav {
          position: fixed;
          left: 50%;
          right: auto;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 14px);
          z-index: 120;
          display: none;
          width: min(calc(100vw - 28px), 420px);
          max-width: 420px;
          overflow: hidden;
          direction: ltr;
          border: 1px solid rgba(255, 255, 255, 0.62);
          border-radius: 999px;
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.78),
              rgba(255, 255, 255, 0.56)
            );
          backdrop-filter: blur(22px) saturate(180%);
          -webkit-backdrop-filter: blur(22px) saturate(180%);
          padding: 0;
          box-shadow:
            0 18px 45px rgba(15, 23, 42, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
          transform: translateX(-50%);
        }

        .mobile-bottom-nav__inner {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          width: 100%;
          height: 68px;
          padding: 0 8px;
          direction: ltr;
        }

        .mobile-bottom-nav__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 0;
          min-height: 100%;
          gap: 4px;
          border-radius: 999px;
          text-decoration: none;
          color: #6b7280;
          box-sizing: border-box;
          text-align: center;
          transition:
            color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        }

        .mobile-bottom-nav__item--search {
          order: 1;
        }

        .mobile-bottom-nav__item--community {
          order: 2;
        }

        .mobile-bottom-nav__item--account {
          order: 3;
        }

        .mobile-bottom-nav__item--active {
          color: #054aff;
        }

        .mobile-bottom-nav__icon {
          width: 22px;
          height: 22px;
          display: block;
          flex-shrink: 0;
        }

        .mobile-bottom-nav__icon--image {
          object-fit: contain;
          filter: grayscale(1) brightness(0.45);
          opacity: 1;
          transition: filter 0.2s ease;
        }

        .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
          filter: brightness(0) saturate(100%) invert(18%) sepia(98%) saturate(5178%)
            hue-rotate(223deg) brightness(104%) contrast(106%);
        }

        .mobile-bottom-nav__label {
          display: block;
          width: 100%;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: 0.01em;
          text-align: center;
          white-space: nowrap;
        }

        @media (hover: hover) and (pointer: fine) {
          .mobile-bottom-nav__item:hover {
            color: #111827;
            background: rgba(255, 255, 255, 0.34);
          }

          .mobile-bottom-nav__item:hover .mobile-bottom-nav__icon--image {
            filter: grayscale(1) brightness(0.2);
            opacity: 1;
          }
        }

        @media (prefers-color-scheme: dark) {
          .form {
            background-color: #0b1220;
            border-color: #3b82f6;
            box-shadow:
              -10px 0px 0px #1d4ed8,
              -10px 7px 18px rgba(0, 0, 0, 0.38);
          }

          #signup-area p {
            color: #ffffff;
          }

          #signup-area #behind,
          #behind {
            color: #2563eb;
          }

          .form:has(.input-area:hover) #signup-area p:first-child,
          .form:has(#footer-area:hover) #signup-area p:first-child {
            color: #0b1220;
          }

          .form:has(.input-area:hover) #signup-area #behind,
          .form:has(#footer-area:hover) #signup-area #behind {
            color: #93c5fd;
          }

          .input-area input {
            border-color: #3b82f6;
            background-color: #111827;
            color: #f8fafc;
            box-shadow: 0px 8px 18px -8px rgba(0, 0, 0, 0.55);
          }

          .input-area input:-webkit-autofill,
          .input-area input:-webkit-autofill:hover,
          .input-area input:-webkit-autofill:focus {
            -webkit-text-fill-color: #f8fafc;
            box-shadow: 0 0 0 1000px #111827 inset;
            transition: background-color 9999s ease-in-out 0s;
          }

          #footer-area {
            color: #93c5fd;
          }

          #footer-area button {
            border-color: #3b82f6;
            background-color: #2563eb;
            box-shadow: 0px 8px 18px -8px rgba(0, 0, 0, 0.55);
          }

          #background-color {
            background-color: #2563eb;
            box-shadow: inset 5px 0px #1d4ed8;
          }

          #link-circle svg {
            filter: drop-shadow(0 8px 14px rgba(37, 99, 235, 0.16));
          }

          ::placeholder {
            color: #93c5fd;
          }

          .input-area:hover input {
            border-color: #ffffff;
            background-color: #2563eb;
            color: #ffffff;
          }

          #footer-area button:active {
            color: #2563eb;
            background-color: #ffffff;
          }

          .error-box {
            background: rgba(37, 99, 235, 0.12);
            color: #bfdbfe;
            border-color: rgba(147, 197, 253, 0.28);
          }

          .success-box {
            background: rgba(22, 163, 74, 0.14);
            color: #bbf7d0;
            border-color: rgba(187, 247, 208, 0.28);
          }

          .mobile-bottom-nav {
            border-color: rgba(255, 255, 255, 0.12);
            background:
              linear-gradient(
                180deg,
                rgba(15, 23, 42, 0.82),
                rgba(15, 23, 42, 0.58)
              );
            box-shadow:
              0 18px 48px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.12);
          }

          .mobile-bottom-nav__item {
            color: #94a3b8;
          }

          .mobile-bottom-nav__item:hover {
            color: #f8fafc;
            background: rgba(255, 255, 255, 0.08);
          }

          .mobile-bottom-nav__item--active {
            color: #60a5fa;
          }

          .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
            filter: brightness(0) saturate(100%) invert(63%) sepia(98%)
              saturate(961%) hue-rotate(181deg) brightness(101%) contrast(96%);
          }

          .mobile-bottom-nav__icon--image {
            filter: brightness(0) invert(1);
            opacity: 0.72;
          }

          .mobile-bottom-nav__item:hover .mobile-bottom-nav__icon--image {
            filter: brightness(0) invert(1);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: block;
          }
        }

        @media (max-width: 640px) {
          .form {
            width: min(90vw, 22rem);
            min-height: 33rem;
            box-shadow:
              -8px 0px 0px #1e40af,
              -8px 6px 10px rgb(0, 0, 0, 0.16);
          }

          .form:hover {
            width: min(90vw, 22rem);
            min-height: 33rem;
          }

          #signup-area p {
            font-size: 1.55em;
          }

          #signup-area #behind {
            font-size: 0.88em;
          }

          #fullName-area:hover ~ #background-color {
            top: 5.6em;
            height: 5.7em;
          }

          #phone-area:hover ~ #background-color {
            top: 11.3em;
            height: 5.7em;
          }

          #email-area:hover ~ #background-color {
            top: 17em;
            height: 5.7em;
          }

          #password-area:hover ~ #background-color {
            top: 22.7em;
            height: 5.7em;
          }

          #footer-area:hover ~ #background-color {
            top: 28.4em;
            height: 10.5em;
          }

          #text-inside {
            font-size: 0.82em;
          }
        }

        @media (max-width: 420px) {
          .mobile-bottom-nav {
            width: calc(100vw - 24px);
            bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
          }
        }

        @media (max-width: 640px) and (prefers-color-scheme: dark) {
          .form {
            box-shadow:
              -8px 0px 0px #1d4ed8,
              -8px 6px 16px rgba(0, 0, 0, 0.36);
          }

          .form:has(.input-area:hover) #signup-area p:first-child,
          .form:has(#footer-area:hover) #signup-area p:first-child {
            color: #0b1220;
          }

          .form:has(.input-area:hover) #signup-area #behind,
          .form:has(#footer-area:hover) #signup-area #behind {
            color: #93c5fd;
          }
        }
      `}</style>
    </main>
  )
}
