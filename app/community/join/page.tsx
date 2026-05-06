"use client";

import Link from "next/link";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Squada_One } from "next/font/google";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const squadaOne = Squada_One({
  subsets: ["latin"],
  weight: "400",
});

const COMMUNITY_FORM_ID = 1;
const APP_LOGO_URL = "https://i.ibb.co/sn0xS95/Navienty-2.jpg";

type SupportedLanguage = "en" | "ar";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type City = {
  id: string;
  name_en: string;
  name_ar: string;
};

type University = {
  id: string;
  city_id: string;
  name_en: string;
  name_ar: string;
};

type CustomSelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder: string;
  disabled?: boolean;
  isArabic?: boolean;
};

const TRANSLATIONS = {
  en: {
    loginOrSignup: "Log in or sign up",
    account: "Account",
    joinCommunity: "Join our community",
    facebook: "Facebook",
    instagram: "Instagram",
    linkedIn: "LinkedIn",
    aboutUs: "About us",
    board: "Board",
    contact: "Contact",
    close: "Close",
    joinUs: "JOIN US",
    becomePart: "Become part of our community",
    fullName: "FULL NAME",
    phoneNumber: "PHONE NUMBER",
    email: "EMAIL",
    loadingCities: "LOADING CITIES...",
    selectCity: "SELECT CITY",
    selectCityFirst: "SELECT CITY FIRST",
    loadingUniversities: "LOADING UNIVERSITIES...",
    selectUniversity: "SELECT UNIVERSITY",
    chooseRole: "CHOOSE YOUR ROLE",
    submitting: "Submitting...",
    joinCommunityButton: "Join Community",
    selectCityError: "Please select a city.",
    selectUniversityError: "Please select a university.",
    chooseRoleError: "Please choose your role.",
    failedCities: "Failed to load cities",
    failedUniversities: "Failed to load universities",
    somethingWentWrong: "Something went wrong",
    submitSuccess: "Your application has been submitted successfully.",
    failedSubmit: "Failed to submit form",
    footerTitle: "Find your way to better student living",
    quickLinks: "Quick Links",
    contactUs: "Contact Us",
    footerEmail: "info@navienty.com",
    search: "Search",
    community: "Community",
    login: "Login",
    copyright: (year: number) =>
      `© ${year} Navienty | All rights reserved.`,
    roles: {
      pr_communications: "PR & Communications",
      photographer: "Photographer",
      videographer: "Videographer",
      video_editor: "Video Editor",
      social_media: "Social Media",
      content_creator: "Content Creator",
      graphic_designer: "Graphic Designer",
      hr: "HR",
    },
  },
  ar: {
    loginOrSignup: "سجّل الدخول أو أنشئ حسابًا",
    account: "الحساب",
    joinCommunity: "انضم إلى مجتمعنا",
    facebook: "فيسبوك",
    instagram: "إنستجرام",
    linkedIn: "لينكدإن",
    aboutUs: "من نحن",
    board: "الإدارة",
    contact: "تواصل معنا",
    close: "إغلاق",
    joinUs: "انضم إلينا",
    becomePart: "كن جزءًا من مجتمعنا",
    fullName: "الاسم بالكامل",
    phoneNumber: "رقم الهاتف",
    email: "البريد الإلكتروني",
    loadingCities: "جاري تحميل المدن...",
    selectCity: "اختر المدينة",
    selectCityFirst: "اختر المدينة أولًا",
    loadingUniversities: "جاري تحميل الجامعات...",
    selectUniversity: "اختر الجامعة",
    chooseRole: "اختر دورك",
    submitting: "جاري الإرسال...",
    joinCommunityButton: "انضم إلى المجتمع",
    selectCityError: "من فضلك اختر المدينة.",
    selectUniversityError: "من فضلك اختر الجامعة.",
    chooseRoleError: "من فضلك اختر دورك.",
    failedCities: "تعذر تحميل المدن",
    failedUniversities: "تعذر تحميل الجامعات",
    somethingWentWrong: "حدث خطأ ما",
    submitSuccess: "تم إرسال طلبك بنجاح.",
    failedSubmit: "تعذر إرسال النموذج",
    footerTitle: "اعثر على طريقك لحياة طلابية أفضل",
    quickLinks: "روابط سريعة",
    contactUs: "تواصل معنا",
    footerEmail: "info@navienty.com",
    search: "استكشاف",
    community: "المجتمع",
    login: "تسجيل الدخول",
    copyright: (year: number) =>
      `© ${year} نافينتي | جميع الحقوق محفوظة.`,
    roles: {
      pr_communications: "العلاقات العامة والاتصالات",
      photographer: "مصور فوتوغرافي",
      videographer: "مصور فيديو",
      video_editor: "مونتير فيديو",
      social_media: "إدارة السوشيال ميديا",
      content_creator: "صانع محتوى",
      graphic_designer: "مصمم جرافيك",
      hr: "الموارد البشرية",
    },
  },
} as const;

const roleOptions = [
  { value: "pr_communications" },
  { value: "photographer" },
  { value: "videographer" },
  { value: "video_editor" },
  { value: "social_media" },
  { value: "content_creator" },
  { value: "graphic_designer" },
  { value: "hr" },
] as const;

function normalizeLanguage(value?: string | null): SupportedLanguage {
  return value === "ar" ? "ar" : "en";
}

function normalizeCurrency(value?: string | null) {
  return value?.trim().toUpperCase() || "EGP";
}

function formatSelectText(value: string, isArabic: boolean) {
  return isArabic ? value : value.toUpperCase();
}

function buildUrl(path: string, language: SupportedLanguage, currency: string) {
  const params = new URLSearchParams();
  params.set("lang", language);
  params.set("currency", currency);

  return `${path}?${params.toString()}`;
}

function isStandalonePwa() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosDevice() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === "macintel" && window.navigator.maxTouchPoints > 1)
  );
}

function PwaInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalonePwa()) {
      setIsVisible(false);
      return;
    }

    if (window.localStorage.getItem("pwa-install-banner-dismissed") === "true") {
      setIsVisible(false);
      return;
    }

    if (isIosDevice()) {
      setIsVisible(true);
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setIsVisible(true);
    }

    function handleAppInstalled() {
      window.localStorage.setItem("pwa-install-banner-dismissed", "true");
      deferredPromptRef.current = null;
      setIsVisible(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function handleClose() {
    window.localStorage.setItem("pwa-install-banner-dismissed", "true");
    setIsVisible(false);
  }

  async function handleInstallClick() {
    if (isIosDevice()) {
      setShowIosHelp((prev) => !prev);
      return;
    }

    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      window.localStorage.setItem("pwa-install-banner-dismissed", "true");
      setIsVisible(false);
    }

    deferredPromptRef.current = null;
  }

  if (!isVisible) return null;

  return (
    <div className="pwa-install-banner">
      <button
        type="button"
        className="pwa-install-banner__close"
        aria-label="Close app install banner"
        onClick={handleClose}
      >
        ×
      </button>

      <img
        src={APP_LOGO_URL}
        alt="Navienty"
        className="pwa-install-banner__logo"
        draggable={false}
      />

      <div className="pwa-install-banner__content">
        <p className="pwa-install-banner__title">Continue in the app!</p>
      </div>

      <button
        type="button"
        className="pwa-install-banner__button"
        onClick={handleInstallClick}
      >
        Get App
      </button>

      {showIosHelp && (
        <div className="pwa-install-banner__ios-help">
          On iPhone: tap Share, then choose Add to Home Screen.
        </div>
      )}
    </div>
  );
}

function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  isArabic = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function updatePosition() {
      if (!open || !triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const horizontalMargin = 12;
      const width = rect.width;
      const left = Math.min(
        Math.max(rect.left, horizontalMargin),
        viewportWidth - width - horizontalMargin
      );

      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left,
        width,
        zIndex: 999999,
      });
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        !(target instanceof Element && target.closest(`[data-portal-id="${id}"]`))
      ) {
        setOpen(false);
      }
    }

    function handleWindowChange() {
      if (open) {
        updatePosition();
      }
    }

    if (open) {
      updatePosition();
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleWindowChange, true);
      window.addEventListener("resize", handleWindowChange);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [open, id]);

  function handleToggle() {
    if (disabled) return;
    setOpen((prev) => !prev);
  }

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((prev) => !prev);
    }

    if (event.key === "Escape") {
      setOpen(false);
    }

    if (event.key === "ArrowDown" && !open) {
      event.preventDefault();
      setOpen(true);
    }
  }

  const dropdown =
    mounted && open && !disabled
      ? createPortal(
          <div
            className="custom-select-portal"
            style={dropdownStyle}
            data-portal-id={id}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div
              id={`${id}-listbox`}
              className="custom-select-options"
              role="listbox"
              aria-labelledby={id}
            >
              {options.length > 0 ? (
                options.map((option) => {
                  const isActive = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`custom-select-option ${
                        isActive ? "custom-select-option--active" : ""
                      }`}
                      onClick={() => handleSelect(option.value)}
                      role="option"
                      aria-selected={isActive}
                    >
                      {formatSelectText(option.label, isArabic)}
                    </button>
                  );
                })
              ) : (
                <div className="custom-select-empty">
                  {formatSelectText(placeholder, isArabic)}
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        ref={wrapperRef}
        className={`custom-select ${open ? "custom-select--open" : ""} ${
          disabled ? "custom-select--disabled" : ""
        }`}
      >
        <button
          ref={triggerRef}
          type="button"
          id={id}
          className="custom-select-trigger"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          disabled={disabled}
        >
          <span
            className={`custom-select-trigger__text ${
              selectedOption ? "is-selected" : ""
            }`}
          >
            {formatSelectText(selectedOption?.label || placeholder, isArabic)}
          </span>

          <span className={`custom-select-trigger__arrow ${open ? "open" : ""}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>

      {dropdown}
    </>
  );
}

export default function CommunityJoinPage() {
  const currentYear = new Date().getFullYear();
  const searchParams = useSearchParams();

  const selectedLanguage = normalizeLanguage(searchParams.get("lang"));
  const selectedCurrency = normalizeCurrency(searchParams.get("currency"));
  const isArabic = selectedLanguage === "ar";
  const t = TRANSLATIONS[selectedLanguage];

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setIsLoggedIn(Boolean(data.user));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const accountHref = buildUrl(
    isLoggedIn ? "/account" : "/account-login",
    selectedLanguage,
    selectedCurrency
  );

  const accountLabel = isLoggedIn ? t.account : t.loginOrSignup;
  const mobileAccountLabel = isLoggedIn ? t.account : t.login;

  const primaryMenuLinks = [
    {
      label: accountLabel,
      href: accountHref,
    },
    {
      label: t.joinCommunity,
      href: buildUrl("/community/join", selectedLanguage, selectedCurrency),
    },
  ];

  const socialMenuLinks = [
    { label: t.facebook, href: "https://www.facebook.com/" },
    { label: t.instagram, href: "https://www.instagram.com/" },
    { label: t.linkedIn, href: "https://www.linkedin.com/" },
  ];

  const footerQuickLinks = [
    {
      label: t.aboutUs,
      href: buildUrl("/about", selectedLanguage, selectedCurrency),
    },
    {
      label: t.board,
      href: buildUrl("/board", selectedLanguage, selectedCurrency),
    },
    {
      label: t.contact,
      href: buildUrl("/contact", selectedLanguage, selectedCurrency),
    },
  ];

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cityId: "",
    cityName: "",
    universityId: "",
    universityName: "",
    desiredRole: "",
  });

  const [cities, setCities] = useState<City[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchCities() {
      try {
        setCitiesLoading(true);

        const res = await fetch("/api/cities", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || t.failedCities);
        }

        setCities(Array.isArray(data) ? data : data.cities || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : t.failedCities;
        setErrorMessage(message);
      } finally {
        setCitiesLoading(false);
      }
    }

    fetchCities();
  }, [t.failedCities]);

  useEffect(() => {
    async function fetchUniversities() {
      if (!formData.cityId) {
        setUniversities([]);
        return;
      }

      try {
        setUniversitiesLoading(true);

        const res = await fetch(
          `/api/universities?cityId=${encodeURIComponent(formData.cityId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || t.failedUniversities);
        }

        setUniversities(Array.isArray(data) ? data : data.universities || []);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t.failedUniversities;
        setErrorMessage(message);
        setUniversities([]);
      } finally {
        setUniversitiesLoading(false);
      }
    }

    fetchUniversities();
  }, [formData.cityId, t.failedUniversities]);

  const cityOptions: CustomSelectOption[] = cities.map((city) => ({
    value: city.id,
    label: isArabic ? city.name_ar || city.name_en : city.name_en || city.name_ar,
  }));

  const universityOptions: CustomSelectOption[] = universities.map(
    (university) => ({
      value: university.id,
      label: isArabic
        ? university.name_ar || university.name_en
        : university.name_en || university.name_ar,
    })
  );

  const roleDropdownOptions: CustomSelectOption[] = roleOptions.map((role) => ({
    value: role.value,
    label: t.roles[role.value],
  }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    if (!formData.cityId) {
      setLoading(false);
      setErrorMessage(t.selectCityError);
      return;
    }

    if (!formData.universityId) {
      setLoading(false);
      setErrorMessage(t.selectUniversityError);
      return;
    }

    if (!formData.desiredRole) {
      setLoading(false);
      setErrorMessage(t.chooseRoleError);
      return;
    }

    try {
      const res = await fetch("/api/community/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formId: COMMUNITY_FORM_ID,
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          whatsapp: formData.phone,
          cityText: formData.cityName,
          universityText: formData.universityName,
          desiredRole: formData.desiredRole,
          cityId: formData.cityId,
          universityId: formData.universityId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || t.somethingWentWrong);
      }

      setSuccessMessage(t.submitSuccess);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        cityId: "",
        cityName: "",
        universityId: "",
        universityName: "",
        desiredRole: "",
      });
      setUniversities([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.failedSubmit;
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative min-h-screen bg-[#f7f7f8] pb-24 text-[#20212a] md:pb-0"
    >
      <PwaInstallBanner />

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

        .pwa-install-banner {
          position: sticky;
          top: 0;
          z-index: 160;
          display: grid;
          grid-template-columns: 26px 46px minmax(0, 1fr) auto;
          align-items: center;
          gap: 9px;
          min-height: 62px;
          background: #ffffff;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
          padding: 8px 12px;
        }

        .pwa-install-banner__close {
          width: 26px;
          height: 26px;
          border: 0;
          background: transparent;
          color: #111827;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          padding: 0;
        }

        .pwa-install-banner__logo {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          display: block;
        }

        .pwa-install-banner__content {
          min-width: 0;
        }

        .pwa-install-banner__title {
          margin: 0;
          color: #111827;
          font-size: 15px;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pwa-install-banner__button {
          min-width: 86px;
          height: 38px;
          border: 0;
          border-radius: 9px;
          background: #054aff;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          padding: 0 16px;
        }

        .pwa-install-banner__ios-help {
          grid-column: 1 / -1;
          margin-top: 6px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #334155;
          padding: 8px 10px;
          font-size: 12px;
          line-height: 1.4;
        }

        @media (display-mode: standalone) {
          .pwa-install-banner {
            display: none !important;
          }
        }

        @media (min-width: 769px) {
          .pwa-install-banner {
            display: none !important;
          }
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

        [dir='rtl'] .navienty-logo-text-wrap {
          transform: translateX(6px);
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

        [dir='rtl'] .mega-menu-close {
          right: auto;
          left: 0;
          flex-direction: row-reverse;
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

        [dir='rtl'] .mega-menu-left {
          left: auto;
          right: 56px;
          align-items: flex-end;
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

        [dir='rtl'] .mega-menu-left-bottom {
          align-items: flex-end;
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

        [dir='rtl'] .mega-menu-main-link {
          letter-spacing: -0.04em;
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

        [dir='rtl'] .footer-esaf-title {
          letter-spacing: -0.03em;
          text-transform: none;
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
          unicode-bidi: isolate;
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

        .mobile-bottom-nav__item:hover .mobile-bottom-nav__icon--image {
          filter: grayscale(1) brightness(0.2);
        }

        .mobile-bottom-nav__item--active {
          color: #054aff;
        }

        .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
          filter: brightness(0) saturate(100%) invert(18%) sepia(98%) saturate(5178%)
            hue-rotate(223deg) brightness(104%) contrast(106%);
        }

        .mobile-bottom-nav__icon {
          width: 22px;
          height: 22px;
          display: block;
        }

        .mobile-bottom-nav__icon--image {
          object-fit: contain;
          filter: grayscale(1) brightness(0.55);
          transition: filter 0.2s ease;
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

          [dir='rtl'] .mega-menu-close {
            right: auto;
            left: 0;
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

          [dir='rtl'] .mega-menu-left {
            left: auto;
            right: 24px;
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

          .mobile-header-inner {
            justify-content: center !important;
          }

          .menu-trigger {
            display: none !important;
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
        <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
          <Link
            href={buildUrl("/properties", selectedLanguage, selectedCurrency)}
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
            className={`menu-trigger ${isArabic ? "mr-auto" : "ml-auto"}`}
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
              <span>{t.close}</span>
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

      <section className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-[#fcfcfd] px-6 py-10">
        <div className="w-full flex justify-center">
          <form onSubmit={handleSubmit} className="community-form">
            <div id="signup-area">
              <p>{t.joinUs}</p>
              <p id="behind">{t.becomePart}</p>
            </div>

            <div id="fullName-area" className="input-area">
              <input
                placeholder={t.fullName}
                id="fullName"
                className="input"
                type="text"
                value={formData.fullName}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    fullName: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div id="phone-area" className="input-area">
              <input
                placeholder={t.phoneNumber}
                id="phone"
                className="input"
                type="tel"
                value={formData.phone}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div id="email-area" className="input-area">
              <input
                placeholder={t.email}
                id="email"
                className="input"
                type="email"
                dir="ltr"
                value={formData.email}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div id="city-area" className="input-area">
              <CustomSelect
                id="city"
                value={formData.cityId}
                placeholder={citiesLoading ? t.loadingCities : t.selectCity}
                disabled={citiesLoading}
                options={cityOptions}
                isArabic={isArabic}
                onChange={(selectedValue) => {
                  const selectedCity = cities.find(
                    (city) => city.id === selectedValue
                  );

                  setFormData((prev) => ({
                    ...prev,
                    cityId: selectedValue,
                    cityName: selectedCity
                      ? isArabic
                        ? selectedCity.name_ar || selectedCity.name_en
                        : selectedCity.name_en || selectedCity.name_ar
                      : "",
                    universityId: "",
                    universityName: "",
                  }));
                }}
              />
            </div>

            <div id="university-area" className="input-area">
              <CustomSelect
                id="university"
                value={formData.universityId}
                placeholder={
                  !formData.cityId
                    ? t.selectCityFirst
                    : universitiesLoading
                    ? t.loadingUniversities
                    : t.selectUniversity
                }
                disabled={!formData.cityId || universitiesLoading}
                options={universityOptions}
                isArabic={isArabic}
                onChange={(selectedValue) => {
                  const selectedUniversity = universities.find(
                    (university) => university.id === selectedValue
                  );

                  setFormData((prev) => ({
                    ...prev,
                    universityId: selectedValue,
                    universityName: selectedUniversity
                      ? isArabic
                        ? selectedUniversity.name_ar ||
                          selectedUniversity.name_en
                        : selectedUniversity.name_en ||
                          selectedUniversity.name_ar
                      : "",
                  }));
                }}
              />
            </div>

            <div id="role-area" className="input-area">
              <CustomSelect
                id="desiredRole"
                value={formData.desiredRole}
                placeholder={t.chooseRole}
                options={roleDropdownOptions}
                isArabic={isArabic}
                onChange={(selectedValue) =>
                  setFormData((prev) => ({
                    ...prev,
                    desiredRole: selectedValue,
                  }))
                }
              />
            </div>

            <div id="footer-area">
              <button type="submit" disabled={loading}>
                {loading ? t.submitting : t.joinCommunityButton}
              </button>

              {errorMessage && <div className="error-box">{errorMessage}</div>}

              {successMessage && (
                <div className="success-box">{successMessage}</div>
              )}
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
                {t.footerTitle}
              </h2>
            </div>

            <div>
              <h3 className="footer-esaf-heading">{t.quickLinks}</h3>
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
              <h3 className="footer-esaf-heading">{t.contactUs}</h3>
              <a href={`mailto:${t.footerEmail}`} className="footer-esaf-email">
                {t.footerEmail}
              </a>
            </div>
          </div>

          <div className="footer-esaf-bottom">
            <p className="footer-esaf-copyright">
              {t.copyright(currentYear)}
            </p>
          </div>
        </div>
      </footer>

      <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
        <div className="mobile-bottom-nav__inner">
          <Link
            href={buildUrl("/properties", selectedLanguage, selectedCurrency)}
            className="mobile-bottom-nav__item"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 16l4 4"
              />
            </svg>
            <span className="mobile-bottom-nav__label">{t.search}</span>
          </Link>

          <Link
            href={buildUrl("/community", selectedLanguage, selectedCurrency)}
            className="mobile-bottom-nav__item mobile-bottom-nav__item--active"
          >
            <img
              src="https://i.ibb.co/fzNcyyxw/community-3010762.png"
              alt="Community"
              className="mobile-bottom-nav__icon mobile-bottom-nav__icon--image"
            />
            <span className="mobile-bottom-nav__label">{t.community}</span>
          </Link>

          <Link href={accountHref} className="mobile-bottom-nav__item">
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
            <span className="mobile-bottom-nav__label">
              {mobileAccountLabel}
            </span>
          </Link>
        </div>
      </nav>

      <style jsx>{`
        .community-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: white;
          width: clamp(20rem, 32vw, 25rem);
          min-height: 51.4rem;
          border: 2px solid #1e40af;
          border-bottom-left-radius: 1.8em;
          border-top-right-radius: 1.8em;
          box-shadow:
            -10px 0px 0px #1e40af,
            -10px 7px 10px rgb(0, 0, 0, 0.18);
          overflow: visible;
          position: relative;
          transition: all 0.25s ease;
          padding-bottom: 0.8rem;
        }

        :global([dir='rtl']) .community-form {
          box-shadow:
            10px 0px 0px #1e40af,
            10px 7px 10px rgb(0, 0, 0, 0.18);
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 1.8em;
          border-top-right-radius: 0;
          border-top-left-radius: 1.8em;
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
        }

        #signup-area #behind {
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

        :global([dir='rtl']) #behind {
          left: auto;
          right: 1.2em;
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

        .input-area :global(.input),
        .input-area input {
          width: 100%;
          border: 2px solid #2563eb;
          border-radius: 0.65em;
          height: 3em;
          padding-left: 1em;
          padding-right: 1em;
          font-size: 0.95rem;
          font-weight: 700;
          transition: all 0.5s ease;
          outline: none;
          box-shadow: 0px 5px 5px -3px rgb(0, 0, 0, 0.2);
          box-sizing: border-box;
          position: relative;
          z-index: 3;
          background-color: white;
          color: #2563eb;
          text-transform: ${isArabic ? "none" : "uppercase"};
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          text-align: ${isArabic ? "right" : "left"};
        }

        .input-area :global(.custom-select) {
          width: 100%;
          position: relative;
        }

        .input-area :global(.custom-select-trigger) {
          width: 100%;
          border: 2px solid #2563eb;
          border-radius: 0.65em;
          min-height: 3em;
          padding: 0 0.95rem 0 1rem;
          font-size: 0.95rem;
          font-weight: 700;
          transition: all 0.3s ease;
          outline: none;
          box-shadow: 0px 5px 5px -3px rgb(0, 0, 0, 0.2);
          box-sizing: border-box;
          position: relative;
          background-color: white;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          text-transform: ${isArabic ? "none" : "uppercase"};
          cursor: pointer;
          text-align: ${isArabic ? "right" : "left"};
        }

        .input-area :global(.custom-select-trigger__text) {
          flex: 1;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .input-area :global(.custom-select-trigger__arrow) {
          width: 1rem;
          height: 1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
          transition: transform 0.25s ease, color 0.25s ease;
          flex-shrink: 0;
        }

        .input-area :global(.custom-select-trigger__arrow.open) {
          transform: rotate(180deg);
        }

        .input-area :global(.custom-select--disabled .custom-select-trigger) {
          cursor: not-allowed;
          opacity: 0.72;
        }

        :global(.custom-select-portal) {
          pointer-events: auto;
        }

        :global(.custom-select-options) {
          max-height: 15.5rem;
          overflow-y: auto;
          border: 2px solid #2563eb;
          border-radius: 1rem;
          background: #ffffff;
          box-shadow:
            0 22px 55px rgba(37, 99, 235, 0.18),
            0 10px 22px rgba(15, 23, 42, 0.08);
          padding: 0.35rem;
        }

        :global(.custom-select-option) {
          width: 100%;
          border: 0;
          background: transparent;
          color: #2563eb;
          text-align: ${isArabic ? "right" : "left"};
          padding: 0.9rem 1rem;
          border-radius: 0.85rem;
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.2;
          text-transform: ${isArabic ? "none" : "uppercase"};
          cursor: pointer;
          transition:
            background-color 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        :global(.custom-select-option:hover) {
          background: #eff6ff;
          color: #1d4ed8;
        }

        :global(.custom-select-option--active) {
          background: #2563eb;
          color: #ffffff;
        }

        :global(.custom-select-empty) {
          padding: 0.9rem 1rem;
          color: #6b7280;
          font-size: 0.92rem;
          font-weight: 700;
          text-transform: ${isArabic ? "none" : "uppercase"};
          text-align: ${isArabic ? "right" : "left"};
        }

        #footer-area {
          margin-top: 0%;
          padding-top: 0.6em;
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          min-height: 11.2em;
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
          opacity: 0.8;
        }

        #footer-area p,
        #footer-area a {
          font-size: 0.84em;
          transition: all 0.25s ease;
          margin: 0;
          text-decoration: none;
          color: inherit;
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

        :global([dir='rtl']) #background-color {
          box-shadow: inset -5px 0px #1e40af;
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

        .community-form:hover {
          width: clamp(20.3rem, 33vw, 25.5rem);
          min-height: 51.8rem;
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

        #city-area:hover ~ #background-color {
          top: 22.7em;
          height: 5.7em;
        }

        #university-area:hover ~ #background-color {
          top: 28.4em;
          height: 5.7em;
        }

        #role-area:hover ~ #background-color {
          top: 34.1em;
          height: 5.7em;
        }

        #footer-area:hover ~ #background-color {
          top: 39.8em;
          height: 11.2em;
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

        .input-area:hover :global(.custom-select-trigger) {
          color: white;
          border: 2px solid white;
          background-color: #2563eb;
          min-height: 3.2em;
        }

        .input-area:hover :global(.custom-select-trigger__arrow) {
          color: white;
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

        @media (max-width: 640px) {
          .community-form {
            width: min(90vw, 22rem);
            min-height: 50.8rem;
            box-shadow:
              -8px 0px 0px #1e40af,
              -8px 6px 10px rgb(0, 0, 0, 0.16);
          }

          :global([dir='rtl']) .community-form {
            box-shadow:
              8px 0px 0px #1e40af,
              8px 6px 10px rgb(0, 0, 0, 0.16);
          }

          .community-form:hover {
            width: min(90vw, 22rem);
            min-height: 50.8rem;
          }

          #signup-area p {
            font-size: 1.55em;
          }

          #signup-area #behind {
            font-size: 0.88em;
          }

          :global(.custom-select-options) {
            max-height: 13.5rem;
          }

          :global(.custom-select-option) {
            padding: 0.82rem 0.9rem;
            font-size: 0.92rem;
          }
        }
      `}</style>
    </main>
  );
}
