import Link from "next/link";
import type { ReactNode } from "react";
import LanguageDropdown from "../LanguageDropdown";
import { getHealthSpecialties } from "@/src/lib/services/health/queries";

type SearchParams = {
  lang?: string;
  currency?: string;
  specialty?: string;
  city_id?: string;
};

type HealthSpecialty = {
  id: string | number;
  slug?: string;
  name_en: string;
  name_ar?: string;
  icon?: string | null;
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
    specialtiesTitle: "Browse medical specialties",
    specialtiesSubtitle: "",
    exploreSpecialty: "Explore specialty",
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
    specialtiesTitle: "تصفح التخصصات الطبية",
    specialtiesSubtitle:
      "اختر التخصص المناسب للوصول بسرعة إلى الطبيب أو مقدم الخدمة الصحية المناسب.",
    exploreSpecialty: "استعرض التخصص",
  },
} as const;

const DEFAULT_SPECIALTY_IMAGE =
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80";

const SPECIALTY_IMAGES: Record<string, string> = {
  dermatology:
    "https://i.ibb.co/jkPZdXH5/Physiotherapy-and-Sport-Injuries-3.png",
  skin: "https://i.ibb.co/jkPZdXH5/Physiotherapy-and-Sport-Injuries-3.png",

  dentistry: "https://i.ibb.co/bgRJ88Gt/Untitled-design-14.png",

  psychiatry: "https://i.ibb.co/N2dX7w3Z/Untitled-design-15.png",
  mental: "https://i.ibb.co/N2dX7w3Z/Untitled-design-15.png",
  emotional: "https://i.ibb.co/N2dX7w3Z/Untitled-design-15.png",
  behavioral: "https://i.ibb.co/N2dX7w3Z/Untitled-design-15.png",
  disorders: "https://i.ibb.co/N2dX7w3Z/Untitled-design-15.png",

  "ear-nose-and-throat": "https://i.ibb.co/ZRd9Gyj2/Untitled-design-16.png",
  "ear-nose-throat": "https://i.ibb.co/ZRd9Gyj2/Untitled-design-16.png",
  ent: "https://i.ibb.co/ZRd9Gyj2/Untitled-design-16.png",
  ear: "https://i.ibb.co/ZRd9Gyj2/Untitled-design-16.png",
  nose: "https://i.ibb.co/ZRd9Gyj2/Untitled-design-16.png",
  throat: "https://i.ibb.co/ZRd9Gyj2/Untitled-design-16.png",

  ophthalmology: "https://i.ibb.co/Q064cHd/Untitled-design-17.png",
  eyes: "https://i.ibb.co/Q064cHd/Untitled-design-17.png",
  eye: "https://i.ibb.co/Q064cHd/Untitled-design-17.png",

  orthopedics: "https://i.ibb.co/60jnY7nx/Untitled-design-18.png",
  orthopedic: "https://i.ibb.co/60jnY7nx/Untitled-design-18.png",
  bones: "https://i.ibb.co/60jnY7nx/Untitled-design-18.png",
  bone: "https://i.ibb.co/60jnY7nx/Untitled-design-18.png",

  physiotherapy:
    "https://i.ibb.co/zhDcM10S/Physiotherapy-and-Sport-Injuries.png",
  "sport-injuries":
    "https://i.ibb.co/zhDcM10S/Physiotherapy-and-Sport-Injuries.png",
  sport: "https://i.ibb.co/zhDcM10S/Physiotherapy-and-Sport-Injuries.png",
  injuries:
    "https://i.ibb.co/zhDcM10S/Physiotherapy-and-Sport-Injuries.png",
  injury: "https://i.ibb.co/zhDcM10S/Physiotherapy-and-Sport-Injuries.png",

  dietitian:
    "https://i.ibb.co/Mx3PnWNT/Physiotherapy-and-Sport-Injuries-1.png",
  nutrition:
    "https://i.ibb.co/Mx3PnWNT/Physiotherapy-and-Sport-Injuries-1.png",
  nutritional:
    "https://i.ibb.co/Mx3PnWNT/Physiotherapy-and-Sport-Injuries-1.png",

  "allergy-and-immunology":
    "https://i.ibb.co/272hwDJd/skin-texture-suffering-severe-rashes.png",
  "allergy-immunology":
    "https://i.ibb.co/272hwDJd/skin-texture-suffering-severe-rashes.png",
  allergy: "https://i.ibb.co/272hwDJd/skin-texture-suffering-severe-rashes.png",
  immunology:
    "https://i.ibb.co/272hwDJd/skin-texture-suffering-severe-rashes.png",

  laboratories:
    "https://i.ibb.co/G4CGqNV2/Physiotherapy-and-Sport-Injuries-2.png",
  laboratory:
    "https://i.ibb.co/G4CGqNV2/Physiotherapy-and-Sport-Injuries-2.png",
  lab: "https://i.ibb.co/G4CGqNV2/Physiotherapy-and-Sport-Injuries-2.png",
  labs: "https://i.ibb.co/G4CGqNV2/Physiotherapy-and-Sport-Injuries-2.png",
};

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === "ar" ? "ar" : "en";
}

function normalizeCurrency(value?: string): SupportedCurrency {
  const upper = value?.toUpperCase();
  return SUPPORTED_CURRENCIES.includes(upper as SupportedCurrency)
    ? (upper as SupportedCurrency)
    : "EGP";
}

function normalizeSlug(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/\(.*?\)/g, " ")
    .replace(/[\/_,]+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getSpecialtyImage(item: HealthSpecialty) {
  const rawSlug = normalizeSlug(item.slug);
  const normalizedName = normalizeSlug(item.name_en);

  const directMatch =
    SPECIALTY_IMAGES[rawSlug] || SPECIALTY_IMAGES[normalizedName];

  if (directMatch) {
    return directMatch;
  }

  const matchSource = `${rawSlug} ${normalizedName}`;

  if (matchSource.includes("dermatology") || matchSource.includes("skin")) {
    return "https://i.ibb.co/jkPZdXH5/Physiotherapy-and-Sport-Injuries-3.png";
  }

  if (matchSource.includes("dentistry") || matchSource.includes("dental")) {
    return "https://i.ibb.co/bgRJ88Gt/Untitled-design-14.png";
  }

  if (
    matchSource.includes("psychiatry") ||
    matchSource.includes("mental") ||
    matchSource.includes("emotional") ||
    matchSource.includes("behavioral")
  ) {
    return "https://i.ibb.co/N2dX7w3Z/Untitled-design-15.png";
  }

  if (
    matchSource.includes("ear") ||
    matchSource.includes("nose") ||
    matchSource.includes("throat") ||
    matchSource.includes("ent")
  ) {
    return "https://i.ibb.co/ZRd9Gyj2/Untitled-design-16.png";
  }

  if (
    matchSource.includes("ophthalmology") ||
    matchSource.includes("eye") ||
    matchSource.includes("eyes")
  ) {
    return "https://i.ibb.co/Q064cHd/Untitled-design-17.png";
  }

  if (
    matchSource.includes("orthopedics") ||
    matchSource.includes("orthopedic") ||
    matchSource.includes("bone") ||
    matchSource.includes("bones")
  ) {
    return "https://i.ibb.co/60jnY7nx/Untitled-design-18.png";
  }

  if (
    matchSource.includes("physiotherapy") ||
    matchSource.includes("sport") ||
    matchSource.includes("injury") ||
    matchSource.includes("injuries")
  ) {
    return "https://i.ibb.co/zhDcM10S/Physiotherapy-and-Sport-Injuries.png";
  }

  if (
    matchSource.includes("dietitian") ||
    matchSource.includes("nutrition") ||
    matchSource.includes("nutritional")
  ) {
    return "https://i.ibb.co/Mx3PnWNT/Physiotherapy-and-Sport-Injuries-1.png";
  }

  if (matchSource.includes("allergy") || matchSource.includes("immunology")) {
    return "https://i.ibb.co/272hwDJd/skin-texture-suffering-severe-rashes.png";
  }

  if (
    matchSource.includes("laboratory") ||
    matchSource.includes("laboratories") ||
    matchSource.includes("lab") ||
    matchSource.includes("labs")
  ) {
    return "https://i.ibb.co/G4CGqNV2/Physiotherapy-and-Sport-Injuries-2.png";
  }

  return DEFAULT_SPECIALTY_IMAGE;
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

export default async function HealthHomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { lang, currency, city_id } = await searchParams;

  const selectedLanguage = normalizeLanguage(lang);
  const selectedCurrency = normalizeCurrency(currency);
  const t = TRANSLATIONS[selectedLanguage];
  const isArabic = selectedLanguage === "ar";

  const specialties = await getHealthSpecialties();
  const healthSpecialties = (specialties ?? []) as HealthSpecialty[];

  const displayedSpecialties = healthSpecialties.slice(0, 10);

  const buildSimpleNavLink = (path: string) => {
    const params = new URLSearchParams();
    params.set("lang", selectedLanguage);
    params.set("currency", selectedCurrency);
    return `${path}?${params.toString()}`;
  };

  const buildServicesHomeLink = () => {
    const params = new URLSearchParams();
    params.set("lang", selectedLanguage);
    params.set("currency", selectedCurrency);
    return `/services?${params.toString()}`;
  };

  const buildSpecialtyLink = (specialtyValue: string) => {
    const params = new URLSearchParams();
    params.set("lang", selectedLanguage);
    params.set("currency", selectedCurrency);
    params.set("specialty", specialtyValue);

    if (city_id) {
      params.set("city_id", city_id);
    }

    return `/services/health/search?${params.toString()}`;
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
        </div>
      </header>

      <section className="bg-gradient-to-b from-[#f8fbff] to-white py-8 md:pt-6 md:pb-14">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1f2937] md:text-4xl">
              {t.specialtiesTitle}
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
              {t.specialtiesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayedSpecialties.map((item) => {
              const specialtyValue = String(item.slug ?? item.id);
              const specialtyName = isArabic
                ? item.name_ar || item.name_en
                : item.name_en;
              const specialtyImage = getSpecialtyImage(item);

              return (
                <Link
                  key={String(item.id)}
                  href={buildSpecialtyLink(specialtyValue)}
                  className="specialty-card group block h-[230px] w-full max-w-[220px] [perspective:1000px]"
                >
                  <div className="specialty-card-content relative h-full w-full rounded-[18px]">
                    <div className="specialty-card-face specialty-card-back">
                      <div className="specialty-card-back-glow" />
                      <div className="specialty-card-back-inner">
                        <img
                          src={specialtyImage}
                          alt={specialtyName}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="specialty-card-face specialty-card-front">
                      <div className="specialty-card-front-overlay" />
                      <div className="specialty-card-front-content">
                        <h2 className="specialty-card-title">{specialtyName}</h2>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

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

            .specialty-card {
              overflow: visible;
            }

            .specialty-card-content {
              transform-style: preserve-3d;
              transition: transform 500ms ease;
              box-shadow: 0 8px 22px rgba(0,0,0,0.16);
            }

            .specialty-card:hover .specialty-card-content {
              transform: rotateY(180deg);
            }

            .specialty-card-face {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              border-radius: 18px;
              overflow: hidden;
              backface-visibility: hidden;
              -webkit-backface-visibility: hidden;
            }

            .specialty-card-front {
              transform: rotateY(180deg);
              background:
                radial-gradient(circle at top left, rgba(255,187,102,0.22), transparent 30%),
                radial-gradient(circle at bottom center, rgba(255,136,102,0.25), transparent 35%),
                radial-gradient(circle at top right, rgba(255,34,51,0.18), transparent 20%),
                linear-gradient(135deg, #111111 0%, #191919 100%);
              color: white;
            }

            .specialty-card-front-overlay {
              position: absolute;
              inset: 0;
              background: linear-gradient(
                180deg,
                rgba(255,255,255,0.03) 0%,
                rgba(255,255,255,0.00) 100%
              );
            }

            .specialty-card-back {
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #151515;
            }

            .specialty-card-back-glow {
              position: absolute;
              content: "";
              display: block;
              width: 140px;
              height: 160%;
              background: linear-gradient(
                90deg,
                transparent,
                #054aff,
                #054aff,
                #054aff,
                #054aff,
                transparent
              );
              animation: specialtyRotation 5000ms infinite linear;
            }

            .specialty-card-back-inner {
              position: absolute;
              inset: 1.5%;
              border-radius: 16px;
              background-color: #151515;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0;
              z-index: 2;
              overflow: hidden;
            }

            .specialty-card-front-content {
              position: absolute;
              inset: 0;
              z-index: 2;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 18px;
              text-align: center;
            }

            .specialty-card-title {
              margin: 0;
              font-size: 22px;
              font-weight: 800;
              line-height: 1.25;
              color: #ffffff;
              text-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
              max-width: 100%;
              word-break: break-word;
            }

            @media (max-width: 640px) {
              .specialty-card-title {
                font-size: 18px;
              }
            }

            @keyframes specialtyRotation {
              0% {
                transform: rotateZ(0deg);
              }
              100% {
                transform: rotateZ(360deg);
              }
            }
          `,
        }}
      />
    </main>
  );
}