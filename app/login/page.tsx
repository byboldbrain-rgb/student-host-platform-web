'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Squada_One } from 'next/font/google'
import { signInUser } from '@/src/lib/supabase/user-auth'
import MobileBottomNav from './components/MobileBottomNav'
import './components/mobile-bottom-nav.css'

const squadaOne = Squada_One({
  subsets: ['latin'],
  weight: '400',
})

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setErrorMessage('')

    try {
      await signInUser({
        email,
        password,
      })

      router.push('/account')
      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Login failed'
      )
    } finally {
      setLoading(false)
    }
  }

  const footerQuickLinks = [
    { label: 'About us', href: '/about' },
    { label: 'Board', href: '/board' },
    { label: 'Contact', href: '/contact' },
  ]

  return (
    <main className="relative min-h-screen bg-white pb-24 text-gray-700 md:pb-0">
      <header className="sticky top-0 z-40 h-20 border-b border-gray-200 bg-[#f7f7f7] shadow-sm md:static md:shadow-none">
        <div className="mx-auto h-full max-w-[1920px] px-4">
          <div className="flex h-full items-center justify-center">
            <Link
              href="/properties"
              className="flex h-full items-center justify-center overflow-hidden"
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

      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#fcfcfd] px-6 py-10 md:min-h-[calc(100vh-120px)]">
        <div className="flex w-full justify-center">
          <form onSubmit={handleSubmit} className="form">
            <div id="login-area">
              <p>LOGIN</p>
              <p id="behind">Log in to your account</p>
            </div>

            <div id="email-area">
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

            <div id="password-area">
              <input
                placeholder="PASSWORD"
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div id="footer-area">
              <button type="submit" disabled={loading}>
                {loading ? 'Authenticating...' : 'Log In'}
              </button>

              {errorMessage && (
                <div className="error-box">
                  {errorMessage.includes('email')
                    ? 'Invalid email or password. Please try again.'
                    : errorMessage}
                </div>
              )}

              <p id="text-inside">
                Don&apos;t have an account?{' '}
                <Link href="/signup" id="link">
                  Sign Up
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

      <footer className="footer-esaf hidden md:block">
        <div className="footer-esaf-container">
          <div className="footer-esaf-top">
            <div className="footer-esaf-top-left">
              <h2 className={`${squadaOne.className} footer-esaf-title`}>
                Find your way to better student living
              </h2>
            </div>

            <div>
              <h3 className="footer-esaf-heading">Quick Links</h3>
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
              <h3 className="footer-esaf-heading">Contact Us</h3>
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
              © {new Date().getFullYear()} Navienty | All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <MobileBottomNav
        active="login"
        accountHref="/login"
        accountLabel="Log in"
      />

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: white;
          width: clamp(20rem, 32vw, 25rem);
          min-height: 30rem;
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

        #login-area,
        #email-area,
        #password-area,
        #footer-area {
          position: relative;
          z-index: 2;
        }

        #login-area {
          width: 100%;
          height: 4.6em;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
        }

        #login-area p {
          top: 0.45em;
          font-size: 1.7em;
          font-weight: bold;
          position: absolute;
          z-index: 2;
          margin: 0;
        }

        #login-area #behind {
          top: 62%;
          font-size: 0.95em;
          font-weight: bold;
          position: absolute;
          z-index: 1;
        }

        #behind {
          position: absolute;
          left: 1.2em;
          color: #2563eb;
        }

        #email-area {
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          height: 6em;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          margin-top: 1em;
          transition: all 0.25s ease;
        }

        #email-area input {
          width: 100%;
          border: 2px solid #2563eb;
          border-radius: 0.65em;
          height: 3em;
          padding-left: 1em;
          font-size: 0.95rem;
          font-weight: 100;
          transition: all 0.5s ease;
          outline: none;
          box-shadow: 0px 5px 5px -3px rgb(0, 0, 0, 0.2);
          box-sizing: border-box;
          position: relative;
          z-index: 3;
        }

        #password-area {
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          height: 6.8em;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          flex-direction: column;
          transition: all 0.25s ease;
        }

        #password-area input {
          width: 100%;
          border: 2px solid #2563eb;
          font-size: 0.95rem;
          border-radius: 0.65em;
          height: 3em;
          padding-left: 1em;
          transition: all 0.25s ease;
          outline: none;
          box-shadow: 0px 5px 5px -3px rgb(0, 0, 0, 0.2);
          box-sizing: border-box;
          position: relative;
          z-index: 3;
        }

        #password-area a {
          padding-top: 0.7em;
          font-size: 0.84em;
          font-weight: bold;
          transition: all 0.25s ease;
          color: #2563eb;
          text-decoration: none;
        }

        #footer-area {
          margin-top: 0%;
          padding-top: 0.3em;
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          min-height: 9em;
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
          height: 4.6em;
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
          min-height: 30.5rem;
        }

        #email-area:hover ~ #background-color {
          top: 5.6em;
          height: 6em;
        }

        #password-area:hover ~ #background-color {
          top: 11.6em;
          height: 6.8em;
        }

        #footer-area:hover ~ #background-color {
          top: 18.4em;
          height: 9em;
        }

        #email-area:hover,
        #password-area:hover,
        #footer-area:hover {
          padding-left: 7%;
          padding-right: 7%;
        }

        #email-area:hover p {
          color: white;
        }

        #email-area:hover input {
          color: white;
          border: 2px solid white;
          background-color: #2563eb;
          height: 3.2em;
        }

        #email-area:hover ::placeholder {
          color: white;
        }

        #password-area:hover p {
          color: white;
        }

        #password-area:hover a {
          color: white;
          padding-right: 5%;
        }

        #password-area:hover input {
          color: white;
          border: 2px solid white;
          background-color: #2563eb;
          height: 3.2em;
        }

        #password-area:hover ::placeholder {
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

        .footer-esaf {
          background: #054aff;
          color: #ffffff;
          margin-top: 56px;
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
          letter-spacing: -0.06em;
          font-weight: 500;
          text-transform: uppercase;
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
            width: min(90vw, 22rem);
            min-height: 29rem;
            box-shadow:
              -8px 0px 0px #1e40af,
              -8px 6px 10px rgb(0, 0, 0, 0.16);
          }

          .form:hover {
            width: min(90vw, 22rem);
            min-height: 29rem;
          }

          #login-area p {
            font-size: 1.55em;
          }

          #login-area #behind {
            font-size: 0.88em;
          }

          #email-area:hover ~ #background-color {
            top: 5.6em;
            height: 6em;
          }

          #password-area:hover ~ #background-color {
            top: 11.6em;
            height: 6.8em;
          }

          #footer-area:hover ~ #background-color {
            top: 18.4em;
            height: 9em;
          }

          #text-inside {
            font-size: 0.82em;
          }
        }
      `}</style>
    </main>
  )
}