import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/src/lib/supabase/server";
import {
  getHealthSpecialties,
  searchHealthDoctors,
} from "@/src/lib/services/health/queries";
import DoctorCard from "../DoctorCard";
import HealthSearchBar from "../HealthSearchBar";
import LanguageDropdown from "../../LanguageDropdown";

type City = { id: string; name_en: string; name_ar: string };

type Props = {
  searchParams?: Promise<{
    q?: string;
    specialty?: string;
    city_id?: string;
    gender?: "male" | "female";
    page?: string;
    lang?: "en" | "ar";
    currency?: string;
  }>;
};

const SUPPORTED_CURRENCIES = [
  "EGP",
  "USD",
  "EUR",
  "BHD",
  "DZD",
  "IQD",
  "JOD",
  "KWD",
  "LBP",
  "LYD",
  "MAD",
  "OMR",
  "QAR",
  "SAR",
  "TND",
] as const;

type SupportedLanguage = "en" | "ar";
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const TRANSLATIONS = {
  en: {
    homes: "Homes",
    services: "Services",
    career: "Career",
    lost: "Lost",
    marketplace: "MarketPlace",
    language: "Language",
    currency: "Currency",
    english: "English",
    arabic: "العربية",
    startSearch: "Start your search",
    healthSearchHint: "Choose city and specialty to search for doctors.",
    noDoctors: "No doctors matched your search.",
  },
  ar: {
    homes: "المنازل",
    services: "الخدمات",
    career: "الوظائف",
    lost: "المفقودات",
    marketplace: "المتجر",
    language: "اللغة",
    currency: "العملة",
    english: "English",
    arabic: "العربية",
    startSearch: "ابدأ بحثك",
    healthSearchHint: "اختر المدينة والتخصص للبحث عن الأطباء.",
    noDoctors: "لا يوجد أطباء مطابقون لبحثك.",
  },
} as const;

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === "ar" ? "ar" : "en";
}

function normalizeCurrency(value?: string): SupportedCurrency {
  const upper = value?.toUpperCase();
  return SUPPORTED_CURRENCIES.includes(upper as SupportedCurrency)
    ? (upper as SupportedCurrency)
    : "EGP";
}

function HomeNavIcon({ className = "" }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/vCgqsdFp/home.png"
      alt="Home"
      className={`object-contain ${className}`}
    />
  );
}

function ServicesNavIcon({ className = "" }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/vvg4L37Z/settings.png"
      alt="Services"
      className={`object-contain ${className}`}
    />
  );
}

function CareerNavIcon({ className = "" }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/kV4SdYVK/business.png"
      alt="Career"
      className={`object-contain ${className}`}
    />
  );
}

function MarketPlaceNavIcon({ className = "" }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/4ZG5y0SG/store.png"
      alt="MarketPlace"
      className={`object-contain ${className}`}
    />
  );
}

function LostNavIcon({ className = "" }: { className?: string }) {
  return (
    <img
      src="https://i.ibb.co/xKksFJD1/left-1.png"
      alt="Lost"
      className={`object-contain ${className}`}
    />
  );
}

function renderTopNavItem({
  href,
  label,
  icon,
  isActive = false,
  isMobile = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  isActive?: boolean;
  isMobile?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex shrink-0 items-center transition ${
        isMobile
          ? "min-w-[58px] flex-col items-center justify-start px-2 py-1"
          : "flex-row gap-2 px-3 pb-1 pt-2"
      } ${
        isActive ? "text-[#222222]" : "text-[#6A6A6A] hover:text-[#222222]"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center ${
          isMobile ? "mb-1.5" : ""
        }`}
      >
        {icon}
      </span>

      <span
        className={`font-sans text-[18px] font-semibold leading-none tracking-tight ${
          isActive ? "text-[#222222]" : "text-inherit"
        } ${isMobile ? "!text-[14px]" : ""}`}
      >
        {label}
      </span>

      {!isMobile && isActive && (
        <div className="absolute left-0 right-0 -bottom-[8px] h-[3px] rounded-full bg-[#222222]" />
      )}

      {isMobile && isActive && (
        <div className="absolute left-0 right-0 -bottom-1 h-[2px] w-full bg-black" />
      )}
    </Link>
  );
}

export default async function HealthSearchPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const selectedLanguage = normalizeLanguage(params.lang);
  const selectedCurrency = normalizeCurrency(params.currency);
  const t = TRANSLATIONS[selectedLanguage];
  const isArabic = selectedLanguage === "ar";
  const searchSectionId = "health-search-section";

  const supabase = await createClient();
  const [specialties, doctorsResult, citiesResult] = await Promise.all([
    getHealthSpecialties(),
    searchHealthDoctors({
      q: params.q,
      specialty: params.specialty,
      city_id: params.city_id,
      gender: params.gender,
      page: params.page ? Number(params.page) : 1,
      pageSize: 12,
    }),
    supabase
      .from("cities")
      .select("id, name_en, name_ar")
      .order("name_en", { ascending: true }),
  ]);

  const cities = (citiesResult.data ?? []) as City[];

  const buildSimpleNavLink = (path: string) => {
    const search = new URLSearchParams();
    search.set("lang", selectedLanguage);
    search.set("currency", selectedCurrency);
    return `${path}?${search.toString()}`;
  };

  const buildServicesHomeLink = () => {
    const search = new URLSearchParams();
    search.set("lang", selectedLanguage);
    search.set("currency", selectedCurrency);
    return `/services?${search.toString()}`;
  };

  const menuButtonClass =
    "flex h-12 min-w-12 items-center justify-center rounded-full border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 shadow-sm transition hover:border-black";

  const menuPanelClass = isArabic
    ? "absolute left-0 top-[calc(100%+10px)] z-40 min-w-[240px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]"
    : "absolute right-0 top-[calc(100%+10px)] z-40 min-w-[240px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]";

  const menuLinkClass =
    "block px-4 py-3 text-sm text-gray-800 transition hover:bg-gray-50";

  return (
    <main
      className="relative min-h-screen bg-white pb-20 text-gray-700 md:pb-0"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm md:static md:bg-[#f7f7f7] md:shadow-none">
        <div className="w-full bg-white pb-1 pt-1 md:hidden">
          <details className="group [&_summary::-webkit-details-marker]:hidden">
            <summary className="mx-4 mb-4 mt-2 flex cursor-pointer list-none items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3.5 shadow-[0_3px_10px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-5 w-5 text-gray-900"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <span className="translate-y-[1px] text-center text-[14px] font-semibold leading-none text-gray-900">
                {t.startSearch}
              </span>
            </summary>

            <div
              id={searchSectionId}
              className="health-searchbar px-4 pb-4 scroll-mt-28"
            >
              <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                {t.healthSearchHint}
              </div>

              <HealthSearchBar
                specialties={specialties}
                cities={cities}
                language={selectedLanguage}
                currency={selectedCurrency}
                initialSpecialty={params.specialty ?? ""}
                initialCityId={params.city_id ?? ""}
              />
            </div>
          </details>

          <div className="flex items-start justify-center gap-4 px-3 pb-2 pt-1">
            {renderTopNavItem({
              href: buildSimpleNavLink("/properties"),
              label: t.homes,
              icon: <HomeNavIcon className="h-[40px] w-[40px]" />,
              isMobile: true,
            })}

            {renderTopNavItem({
              href: buildServicesHomeLink(),
              label: t.services,
              icon: <ServicesNavIcon className="h-[40px] w-[40px]" />,
              isActive: true,
              isMobile: true,
            })}

            {renderTopNavItem({
              href: buildSimpleNavLink("/career"),
              label: t.career,
              icon: <CareerNavIcon className="h-[40px] w-[40px]" />,
              isMobile: true,
            })}

            {renderTopNavItem({
              href: buildSimpleNavLink("/marketplace"),
              label: t.marketplace,
              icon: <MarketPlaceNavIcon className="h-[40px] w-[40px]" />,
              isMobile: true,
            })}

            {renderTopNavItem({
              href: buildSimpleNavLink("/lost"),
              label: t.lost,
              icon: <LostNavIcon className="h-[40px] w-[40px]" />,
              isMobile: true,
            })}
          </div>
        </div>

        <div className="mx-auto hidden max-w-[1920px] px-6 md:block">
          <div className="flex items-center justify-between pt-0">
            <div className="flex items-center">
              <Link
                href={buildSimpleNavLink("/properties")}
                className="flex items-center gap-2"
              >
                <img
                  src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                  alt="Logo"
                  style={{
                    width: "140px",
                    height: "auto",
                    marginTop: "-15px",
                    display: "block",
                  }}
                />
              </Link>
            </div>

            <div className="flex items-center justify-center gap-5 xl:gap-8">
              {renderTopNavItem({
                href: buildSimpleNavLink("/properties"),
                label: t.homes,
                icon: <HomeNavIcon className="h-[40px] w-[40px]" />,
              })}

              {renderTopNavItem({
                href: buildServicesHomeLink(),
                label: t.services,
                icon: <ServicesNavIcon className="h-[40px] w-[40px]" />,
                isActive: true,
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink("/career"),
                label: t.career,
                icon: <CareerNavIcon className="h-[40px] w-[40px]" />,
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink("/marketplace"),
                label: t.marketplace,
                icon: <MarketPlaceNavIcon className="h-[40px] w-[40px]" />,
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink("/lost"),
                label: t.lost,
                icon: <LostNavIcon className="h-[40px] w-[40px]" />,
              })}
            </div>

            <div className="flex items-center gap-3">
              <LanguageDropdown
                selectedLanguage={selectedLanguage}
                menuButtonClass={menuButtonClass}
                menuPanelClass={menuPanelClass}
                menuLinkClass={menuLinkClass}
                translations={TRANSLATIONS}
              />
            </div>
          </div>

          <div
            id={searchSectionId}
            className="health-searchbar flex justify-center pb-10 pt-3 scroll-mt-28"
          >
            <div className="w-full max-w-6xl">
              <HealthSearchBar
                specialties={specialties}
                cities={cities}
                language={selectedLanguage}
                currency={selectedCurrency}
                initialSpecialty={params.specialty ?? ""}
                initialCityId={params.city_id ?? ""}
              />
            </div>
          </div>
        </div>
      </header>

      <div
        className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-8"
        dir={isArabic ? "rtl" : "ltr"}
      >
        {doctorsResult.items.length === 0 ? (
          <div className="rounded-[24px] border border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm">
            {t.noDoctors}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {doctorsResult.items.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                language={selectedLanguage}
                currency={params.currency || "EGP"}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="mt-8 bg-gray-100 py-6">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4">
          <p className="text-sm text-gray-600">© 2026 Navienty, Inc.</p>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <a
              href="https://www.facebook.com/yourPage"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                className="h-6 w-6 text-blue-600"
              >
                <path d="M576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 440 146.7 540.8 258.2 568.5L258.2 398.2L205.4 398.2L205.4 320L258.2 320L258.2 286.3C258.2 199.2 297.6 158.8 383.2 158.8C399.4 158.8 427.4 162 438.9 165.2L438.9 236C432.9 235.4 422.4 235 409.3 235C367.3 235 351.1 250.9 351.1 292.2L351.1 320L434.7 320L420.3 398.2L351 398.2L351 574.1C477.8 558.8 576 450.9 576 320z" />
              </svg>
            </a>

            <a
              href="https://www.instagram.com/yourPage"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                className="h-6 w-6 text-purple-600"
              >
                <path d="M320.3 205C256.8 204.8 205.2 256.2 205 319.7C204.8 383.2 256.2 434.8 319.7 435C383.2 435.2 434.8 383.8 435 320.3C435.2 256.8 383.8 205.2 320.3 205zM319.7 245.4C360.9 245.2 394.4 278.5 394.6 319.7C394.8 360.9 361.5 394.4 320.3 394.6C279.1 394.8 245.6 361.5 245.4 320.3C245.2 279.1 278.5 245.6 319.7 245.4zM413.1 200.3C413.1 185.5 425.1 173.5 439.9 173.5C454.7 173.5 466.7 185.5 466.7 200.3C466.7 215.1 454.7 227.1 439.9 227.1C425.1 227.1 413.1 215.1 413.1 200.3zM542.8 227.5C541.1 191.6 532.9 159.8 506.6 133.6C480.4 107.4 448.6 99.2 412.7 97.4C375.7 95.3 264.8 95.3 227.8 97.4C192 99.1 160.2 107.3 133.9 133.5C107.6 159.7 99.5 191.5 97.7 227.4C95.6 264.4 95.6 375.3 97.7 412.3C99.4 448.2 107.6 480 133.9 506.2C160.2 532.4 191.9 540.6 227.8 542.4C264.8 544.5 375.7 544.5 412.7 542.4C448.6 540.7 480.4 532.5 506.6 506.2C532.8 480 541 448.2 542.8 412.3C544.9 375.3 544.9 264.5 542.8 227.5zM495 452C487.2 471.6 472.1 486.7 452.4 494.6C422.9 506.3 352.9 503.6 320.3 503.6C287.7 503.6 217.6 506.2 188.2 494.6C168.6 486.8 153.5 471.7 145.6 452C133.9 422.5 136.6 352.5 136.6 319.9C136.6 287.3 134 217.2 145.6 187.8C153.4 168.2 168.5 153.1 188.2 145.2C217.7 133.5 287.7 136.2 320.3 136.2C352.9 136.2 423 133.6 452.4 145.2C472 153 487.1 168.1 495 187.8C506.7 217.3 504 287.3 504 319.9C504 352.5 506.7 422.6 495 452z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            html {
              scroll-behavior: smooth;
            }

            @media (max-width: 767px) {
              .health-searchbar form {
                border-radius: 28px !important;
              }
            }
          `,
        }}
      />
    </main>
  );
}