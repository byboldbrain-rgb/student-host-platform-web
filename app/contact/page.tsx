import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { Squada_One } from "next/font/google";

const squadaOne = Squada_One({
  subsets: ["latin"],
  weight: "400",
});

const primaryMenuLinks = [
  { label: "Log in or sign up", href: "/login" },
  { label: "Join our community", href: "/community" },
];

const socialMenuLinks = [
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
];

const footerQuickLinks = [
  { label: "About us", href: "/about" },
  { label: "Board", href: "/board" },
  { label: "Contact", href: "/contact" },
];

const contactCards = [
  {
    title: "WhatsApp",
    text: "Chat with our team directly on WhatsApp for quick support and guidance.",
    value: "+20 101 866 8663",
    color: "text-[#22c55e]",
    href: "https://wa.me/201018668663",
    external: true,
    iconType: "whatsapp",
  },
  {
    title: "Call us",
    text: "Reach us by phone for urgent inquiries or direct assistance.",
    value: "+20 101 866 8663",
    color: "text-blue-600",
    href: "tel:+201018668663",
    external: false,
    iconType: "phone",
  },
  {
    title: "Email us",
    text: "Send us your questions, feedback, or partnership requests anytime.",
    value: "contact@navienty.com",
    color: "text-blue-600",
    href: "mailto:contact@navienty.com",
    external: false,
    iconType: "mail",
  },
] as const;

const faqItems = [
  {
    q: "How can I get help with student housing or services?",
    a: "You can contact us directly through WhatsApp, phone, or email and our team will guide you to the right solution.",
  },
  {
    q: "Can I contact Navienty for partnerships?",
    a: "Yes. We welcome partnership opportunities with universities, service providers, and trusted student-focused brands.",
  },
  {
    q: "How quickly will I get a response?",
    a: "We do our best to reply as fast as possible, especially through WhatsApp for urgent requests.",
  },
];

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.05 4.94A9.86 9.86 0 0 0 12.03 2C6.57 2 2.12 6.44 2.12 11.91c0 1.75.46 3.46 1.34 4.97L2 22l5.27-1.38a9.86 9.86 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.92 0-2.65-1.03-5.15-2.9-7.01Zm-7.02 15.2h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.13.82.84-3.05-.2-.31a8.19 8.19 0 0 1-1.26-4.37c0-4.53 3.69-8.22 8.24-8.22 2.2 0 4.26.85 5.82 2.41a8.15 8.15 0 0 1 2.4 5.82c0 4.54-3.69 8.22-8.22 8.22Zm4.5-6.13c-.25-.13-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.17-.29.19-.54.07-.25-.13-1.05-.39-2-1.25-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.38-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.07-.13-.56-1.35-.76-1.85-.2-.49-.4-.43-.56-.44h-.48c-.17 0-.45.06-.69.32-.23.25-.89.87-.89 2.12s.91 2.46 1.03 2.63c.13.17 1.78 2.73 4.31 3.82.6.26 1.08.42 1.45.54.61.19 1.17.16 1.61.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

function PillButton({
  children,
  as = "button",
  href,
}: {
  children: React.ReactNode;
  as?: "button" | "link";
  href?: string;
}) {
  const className =
    "inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(37,99,235,0.25)] transition hover:scale-[1.02] md:px-6 md:py-3.5 md:text-sm";

  if (as === "link" && href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return <button className={className}>{children}</button>;
}

function SectionTitle({ black, purple }: { black: string; purple: string }) {
  return (
    <h2 className="text-3xl font-bold leading-none tracking-[-0.04em] text-[#20212a] md:text-5xl xl:text-[60px]">
      {black} <span className="text-blue-600">{purple}</span>
    </h2>
  );
}

export default function ContactPage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="relative min-h-screen bg-[#f7f7f8] pb-24 text-[#20212a] md:pb-0">
      <input
        id="nav-menu-toggle"
        type="checkbox"
        className="peer sr-only"
        aria-hidden="true"
      />

      <style>{`
        :root {
          --menu-blue: #054aff;
          --menu-cream: #f2ead8;
          --menu-cream-soft: rgba(242, 234, 216, 0.92);
        }

        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          text-decoration: none;
          transform: translateY(-7px);
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

        .menu-trigger {
          width: 40px;
          height: 40px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .menu-trigger:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .menu-trigger-lines {
          position: relative;
          width: 26px;
          height: 10px;
          display: block;
        }

        .menu-trigger-lines span {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          background: #000000;
          border-radius: 2px;
        }

        .menu-trigger-lines span:nth-child(1) {
          top: 0;
        }

        .menu-trigger-lines span:nth-child(2) {
          bottom: 0;
        }

        .mega-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 140;
          background: var(--menu-blue);
          color: var(--menu-cream);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(-8px);
          transition:
            opacity 0.26s ease,
            visibility 0.26s ease,
            transform 0.26s ease;
        }

        .peer:checked ~ .mega-menu-overlay {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0);
        }

        .mega-menu-wrap {
          position: relative;
          min-height: 100dvh;
          padding: 38px 56px 38px;
        }

        .mega-menu-top {
          position: absolute;
          left: 56px;
          right: 56px;
          top: 36px;
          height: 56px;
          z-index: 3;
        }

        .mega-menu-close {
          position: absolute;
          right: 0;
          top: 0;
          display: inline-flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          color: var(--menu-cream);
          font-size: 18px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .mega-menu-close-line {
          width: 46px;
          height: 2px;
          border-radius: 999px;
          background: currentColor;
          display: inline-block;
          transform: translateY(-1px);
        }

        .mega-menu-body {
          position: relative;
          min-height: calc(100dvh - 76px);
          padding-top: 100px;
          width: 100%;
          padding-left: 56px;
          padding-right: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mega-menu-left {
          position: absolute;
          left: 56px;
          bottom: 36px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 220px;
          min-width: 220px;
          min-height: auto;
        }

        .mega-menu-left-spacer {
          display: none;
        }

        .mega-menu-left-bottom {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding-bottom: 0;
        }

        .mega-menu-small-link {
          color: var(--menu-cream);
          text-decoration: none;
          font-size: 22px;
          line-height: 1.28;
          font-weight: 600;
          letter-spacing: -0.03em;
          display: block;
          width: fit-content;
        }

        .mega-menu-small-link:hover {
          opacity: 0.88;
        }

        .mega-menu-right {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-width: 0;
          padding-top: 0;
          transform: translateY(-100px);
        }

        .mega-menu-main-links {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          width: 100%;
          max-width: 900px;
          text-align: center;
        }

        .mega-menu-main-link {
          color: var(--menu-cream);
          text-decoration: none;
          font-weight: 600;
          font-size: 64px;
          line-height: 1.15;
          letter-spacing: -0.075em;
          display: block;
          width: fit-content;
        }

        .mega-menu-main-link:hover {
          opacity: 0.9;
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

        .mobile-bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 120;
          display: none;
          background: rgba(255, 255, 255, 0.96);
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
          box-shadow: 0 -8px 30px rgba(15, 23, 42, 0.08);
        }

        .mobile-bottom-nav__inner {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          height: 64px;
          padding: 0 8px;
        }

        .mobile-bottom-nav__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          color: #6b7280;
          min-height: 100%;
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .mobile-bottom-nav__item:hover {
          color: #111827;
        }

        .mobile-bottom-nav__item--active {
          color: #054aff;
        }

        .mobile-bottom-nav__icon {
          width: 22px;
          height: 22px;
          display: block;
        }

        .mobile-bottom-nav__label {
          font-size: 11px;
          line-height: 1;
          font-weight: 500;
          letter-spacing: 0.01em;
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

        @media (max-width: 1024px) {
          .mega-menu-wrap {
            padding: 26px 24px 28px;
            overflow-y: auto;
          }

          .mega-menu-top {
            left: 24px;
            right: 24px;
            top: 24px;
            height: 40px;
          }

          .mega-menu-close {
            right: 0;
            top: 0;
            font-size: 16px;
            gap: 12px;
          }

          .mega-menu-close-line {
            width: 34px;
          }

          .mega-menu-body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: auto;
            padding-top: 160px;
            padding-left: 0;
            padding-right: 0;
            padding-bottom: 140px;
          }

          .mega-menu-left {
            position: absolute;
            left: 24px;
            bottom: 28px;
            width: auto;
            min-width: 0;
          }

          .mega-menu-left-bottom {
            width: 100%;
            padding-bottom: 0;
            gap: 12px;
          }

          .mega-menu-right {
            width: 100%;
            min-width: 0;
            padding-top: 0;
            transform: translateY(-40px);
          }

          .mega-menu-main-links {
            gap: 6px;
            max-width: 100%;
          }

          .mega-menu-main-link {
            font-size: clamp(54px, 14.4vw, 86px);
            line-height: 1.05;
            white-space: normal;
          }

          .mega-menu-small-link {
            font-size: 24px;
          }
        }

        @media (max-width: 768px) {
          .navienty-logo {
            transform: none;
          }

          .navienty-logo-icon {
            width: 42px;
            height: 42px;
          }

          .navienty-logo-text-wrap {
            display: none;
          }

          .mobile-bottom-nav {
            display: block;
          }

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
      `}</style>

      <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
        <div className="flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
          <Link
            href="/properties?lang=en&currency=EGP"
            className="navienty-logo mt-2"
            aria-label="Navienty home"
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

          <label
            htmlFor="nav-menu-toggle"
            className="menu-trigger ml-auto"
            aria-label="Open menu"
          >
            <span className="menu-trigger-lines">
              <span className="bg-black" />
              <span className="bg-black" />
            </span>
          </label>
        </div>
      </header>

      <div className="mega-menu-overlay">
        <div className="mega-menu-wrap">
          <div className="mega-menu-top">
            <label
              htmlFor="nav-menu-toggle"
              className="mega-menu-close"
              aria-label="Close menu"
            >
              <span className="mega-menu-close-line" />
              <span>Close</span>
            </label>
          </div>

          <div className="mega-menu-body">
            <div className="mega-menu-left">
              <div className="mega-menu-left-spacer" />

              <div className="mega-menu-left-bottom">
                {socialMenuLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mega-menu-small-link"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="mega-menu-right">
              <div className="mega-menu-main-links">
                {primaryMenuLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="mega-menu-main-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="px-4 pb-8 pt-6 md:px-6 xl:px-0 xl:pb-12 xl:pt-8">
        <div className="mx-auto rounded-[30px] bg-[#f2f1f8] px-7 py-12 md:px-10 md:py-16 xl:px-14 xl:py-20">
          <div className="mx-auto max-w-[760px] xl:mx-0">
            <SectionTitle black="Contact" purple="Navienty" />

            <div className="mt-6 max-w-[620px] space-y-4 text-[16px] leading-[1.7] text-[#22232c] md:text-[18px] xl:text-[19px]">
              <p>
                We’re here to make your student journey smoother, simpler, and
                more connected. Whether you have a question about our services,
                need support, or want to explore a partnership, our team is
                ready to help.
              </p>
              <p>
                Reach out through your preferred channel and we’ll connect you
                with the right support as quickly as possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 md:px-6 xl:px-0 xl:pb-10">
        <div className="mx-auto bg-[#def1f3] px-7 py-8 md:px-9 xl:px-12 xl:py-12">
          <div className="grid gap-8 xl:grid-cols-3 xl:items-stretch">
            {contactCards.map((card) => (
              <a
                key={card.title}
                href={card.href}
                target={card.external ? "_blank" : undefined}
                rel={card.external ? "noopener noreferrer" : undefined}
                className="rounded-[24px] bg-white p-6 shadow-[0_6px_18px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f7ff]">
                  {card.iconType === "whatsapp" ? (
                    <WhatsAppIcon className={`h-7 w-7 ${card.color}`} />
                  ) : card.iconType === "phone" ? (
                    <Phone className={`h-7 w-7 ${card.color}`} />
                  ) : (
                    <Mail className={`h-7 w-7 ${card.color}`} />
                  )}
                </div>

                <h3 className="mt-5 text-[22px] font-bold tracking-[-0.04em] text-[#20212a]">
                  {card.title}
                </h3>

                <p className="mt-3 text-[15px] leading-[1.7] text-[#555660]">
                  {card.text}
                </p>

                <p className="mt-4 text-sm font-semibold text-blue-600">
                  {card.value}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 md:px-6 xl:px-0 xl:pb-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-7">
            <SectionTitle black="Send us a" purple="message" />
          </div>

          <div className="grid gap-8 xl:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] md:p-8 xl:p-10">
              <form className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-semibold text-[#20212a]"
                    >
                      First name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="Your first name"
                      className="w-full rounded-[16px] border border-[#e4e7ef] bg-[#fafbff] px-4 py-3.5 text-sm text-[#20212a] outline-none transition focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-semibold text-[#20212a]"
                    >
                      Last name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Your last name"
                      className="w-full rounded-[16px] border border-[#e4e7ef] bg-[#fafbff] px-4 py-3.5 text-sm text-[#20212a] outline-none transition focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-[#20212a]"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="w-full rounded-[16px] border border-[#e4e7ef] bg-[#fafbff] px-4 py-3.5 text-sm text-[#20212a] outline-none transition focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-semibold text-[#20212a]"
                    >
                      Phone number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+20 ..."
                      className="w-full rounded-[16px] border border-[#e4e7ef] bg-[#fafbff] px-4 py-3.5 text-sm text-[#20212a] outline-none transition focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-semibold text-[#20212a]"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="How can we help?"
                    className="w-full rounded-[16px] border border-[#e4e7ef] bg-[#fafbff] px-4 py-3.5 text-sm text-[#20212a] outline-none transition focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-semibold text-[#20212a]"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    placeholder="Write your message here..."
                    className="w-full resize-none rounded-[16px] border border-[#e4e7ef] bg-[#fafbff] px-4 py-3.5 text-sm text-[#20212a] outline-none transition focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="pt-2">
                  <PillButton>
                    Send Message <ArrowRight className="h-4 w-4" />
                  </PillButton>
                </div>
              </form>
            </div>

            <div className="rounded-[28px] bg-[#f2f1f8] p-6 md:p-8 xl:p-10">
              <h3 className="text-3xl font-bold tracking-[-0.04em] text-[#20212a] md:text-4xl">
                Frequently asked questions
              </h3>

              <div className="mt-6 space-y-4">
                {faqItems.map((item) => (
                  <div
                    key={item.q}
                    className="rounded-[22px] bg-white p-5 shadow-[0_4px_14px_rgba(0,0,0,0.03)]"
                  >
                    <h4 className="text-base font-bold text-[#20212a]">
                      {item.q}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-[#555660]">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-6 md:px-6 xl:px-0 xl:pb-8">
        <div className="mx-auto rounded-[28px] bg-[#def1f3] px-7 py-12 md:px-9 xl:px-12 xl:py-14">
          <div className="mx-auto max-w-[760px] text-center">
            <h3 className="text-3xl font-bold tracking-[-0.04em] text-[#20212a] md:text-4xl">
              Let’s build a better student experience together
            </h3>
            <p className="mt-4 text-sm leading-6 text-[#42434c] md:text-base">
              Whether you’re a student, parent, university, or service
              provider, Navienty is ready to connect you with the right next
              step.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <PillButton as="link" href="/community">
                Join our Community <ArrowRight className="h-4 w-4" />
              </PillButton>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-[#d7d9e4] bg-white px-5 py-3 text-xs font-semibold text-[#20212a] transition hover:bg-[#f8f8fb] md:px-6 md:py-3.5 md:text-sm"
              >
                Learn more about us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-esaf">
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
              © {currentYear} Navienty | All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
        <div className="mobile-bottom-nav__inner">
          <Link href="/properties" className="mobile-bottom-nav__item">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.9}
              stroke="currentColor"
              className="mobile-bottom-nav__icon"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 16l4 4"
              />
            </svg>
            <span className="mobile-bottom-nav__label">Explore</span>
          </Link>

          <Link href="/community" className="mobile-bottom-nav__item">
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
                d="M12 20.25s-6.75-4.35-9-8.25C1.2 8.7 3.3 4.5 7.5 4.5c2.1 0 3.45 1.2 4.5 2.55 1.05-1.35 2.4-2.55 4.5-2.55 4.2 0 6.3 4.2 4.5 7.5-2.25 3.9-9 8.25-9 8.25Z"
              />
            </svg>
            <span className="mobile-bottom-nav__label">Community</span>
          </Link>

          <Link
            href="/contact"
            className="mobile-bottom-nav__item mobile-bottom-nav__item--active"
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
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5A2.25 2.25 0 0 0 2.25 6.75m19.5 0-8.72 5.813a1.875 1.875 0 0 1-2.08 0L2.25 6.75"
              />
            </svg>
            <span className="mobile-bottom-nav__label">Contact</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}