'use client'

import { useActionState } from 'react'
import { changeAdminPasswordAction } from './actions'

const initialState = {
  ok: false,
  message: '',
}

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changeAdminPasswordAction,
    initialState
  )

  return (
    <form action={formAction} className="form">
      <div id="login-area">
        <p>SECURITY</p>
        <p id="behind">Change your password</p>
      </div>

      <div id="current-password-area">
        <input
          name="current_password"
          placeholder="CURRENT PASSWORD"
          id="current-password"
          className="input"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      <div id="new-password-area">
        <input
          name="new_password"
          placeholder="NEW PASSWORD"
          id="new-password"
          className="input"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />

        <p>Password must be at least 8 characters</p>
      </div>

      <div id="confirm-password-area">
        <input
          name="confirm_password"
          placeholder="CONFIRM NEW PASSWORD"
          id="confirm-password"
          className="input"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <div id="footer-area">
        <button type="submit" disabled={isPending}>
          {isPending ? 'Changing Password...' : 'Change Password'}
        </button>

        {state.message ? (
          <div className={state.ok ? 'success-box' : 'error-box'}>
            {state.message}
          </div>
        ) : null}
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

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: white;
          width: clamp(20rem, 32vw, 25rem);
          min-height: 36rem;
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
        #current-password-area,
        #new-password-area,
        #confirm-password-area,
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

        #current-password-area {
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

        #current-password-area input {
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

        #new-password-area {
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

        #new-password-area input {
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

        #new-password-area p {
          padding-top: 0.7em;
          font-size: 0.78em;
          font-weight: bold;
          transition: all 0.25s ease;
          color: #2563eb;
          margin: 0;
          text-align: right;
        }

        #confirm-password-area {
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          height: 6em;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          transition: all 0.25s ease;
        }

        #confirm-password-area input {
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

        #footer-area {
          margin-top: 0%;
          padding-top: 0.3em;
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          min-height: 8.5em;
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
          cursor: not-allowed;
          opacity: 0.75;
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
          position: relative;
          z-index: 2;
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
          min-height: 36.5rem;
        }

        #current-password-area:hover ~ #background-color {
          top: 5.6em;
          height: 6em;
        }

        #new-password-area:hover ~ #background-color {
          top: 11.6em;
          height: 6.8em;
        }

        #confirm-password-area:hover ~ #background-color {
          top: 18.4em;
          height: 6em;
        }

        #footer-area:hover ~ #background-color {
          top: 24.4em;
          height: 8.5em;
        }

        #current-password-area:hover,
        #new-password-area:hover,
        #confirm-password-area:hover,
        #footer-area:hover {
          padding-left: 7%;
          padding-right: 7%;
        }

        #current-password-area:hover input {
          color: white;
          border: 2px solid white;
          background-color: #2563eb;
          height: 3.2em;
        }

        #current-password-area:hover ::placeholder {
          color: white;
        }

        #new-password-area:hover p {
          color: white;
          padding-right: 5%;
        }

        #new-password-area:hover input {
          color: white;
          border: 2px solid white;
          background-color: #2563eb;
          height: 3.2em;
        }

        #new-password-area:hover ::placeholder {
          color: white;
        }

        #confirm-password-area:hover input {
          color: white;
          border: 2px solid white;
          background-color: #2563eb;
          height: 3.2em;
        }

        #confirm-password-area:hover ::placeholder {
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
          background: #ecfdf5;
          color: #047857;
          padding: 0.75em 0.85em;
          border-radius: 0.6em;
          font-size: 0.8em;
          width: 100%;
          border: 1px solid #a7f3d0;
          text-align: center;
          box-sizing: border-box;
        }

        @media (max-width: 640px) {
          .form {
            width: min(90vw, 22rem);
            min-height: 35rem;
            box-shadow:
              -8px 0px 0px #1e40af,
              -8px 6px 10px rgb(0, 0, 0, 0.16);
          }

          .form:hover {
            width: min(90vw, 22rem);
            min-height: 35rem;
          }

          #login-area p {
            font-size: 1.55em;
          }

          #login-area #behind {
            font-size: 0.88em;
          }

          #current-password-area:hover ~ #background-color {
            top: 5.6em;
            height: 6em;
          }

          #new-password-area:hover ~ #background-color {
            top: 11.6em;
            height: 6.8em;
          }

          #confirm-password-area:hover ~ #background-color {
            top: 18.4em;
            height: 6em;
          }

          #footer-area:hover ~ #background-color {
            top: 24.4em;
            height: 8.5em;
          }
        }
      `}</style>
    </form>
  )
}