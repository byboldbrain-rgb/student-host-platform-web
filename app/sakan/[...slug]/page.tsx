import Link from "next/link";
import Script from "next/script";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "../../../src/lib/supabase/server";
import PropertiesHeader from "../../properties/PropertiesHeader";
import SortDropdown from "../../properties/search/SortDropdown";
import PropertyImageSlider from "./PropertyImageSlider";
import PropertyAlertRequestCard from "./PropertyAlertRequestCard";
import PropertiesMap from "./PropertiesMap";
import MobileSearchMapSheet from "./MobileSearchMapSheet";
import MobileBottomNavScrollController from "./MobileBottomNavScrollController";
import { Squada_One } from "next/font/google";
import {
  getCachedSakanPageData,
  getCachedSakanSeoPages,
} from "../../properties/data";
import { SITE_URL } from "@/src/lib/site";
const MIN_INDEXABLE_RESULTS = 3;

function buildPath(slug: string[]) {
  return `/sakan/${slug
    .map((item) => item.trim())
    .filter(Boolean)
    .join("/")}`;
}

export async function generateStaticParams() {
  const seoPages = await getCachedSakanSeoPages();

  return seoPages
    .filter(
      (page) =>
        page.is_indexable &&
        page.published_properties_count >= MIN_INDEXABLE_RESULTS,
    )
    .map((page) => ({
      slug: page.path.replace(/^\/sakan\//, "").split("/"),
    }));
}

export async function generateMetadata({
  params,
}: Pick<PageProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const path = buildPath(slug);
  const { seoPage } = await getCachedSakanPageData(path);

  if (!seoPage) {
    return {
      title: "سكن الطلاب | Navienty",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const shouldIndex =
    seoPage.is_indexable &&
    seoPage.published_properties_count >= MIN_INDEXABLE_RESULTS;

  const title =
    seoPage.seo_title_ar ||
    seoPage.seo_h1_ar ||
    `سكن طلاب في ${seoPage.entity_name_ar}`;
  const description =
    seoPage.seo_description_ar ||
    "اكتشف سكن طلاب وسكن طالبات قريب من الجامعة، قارن الأسعار والصور والموقع، وتواصل مباشرة مع المضيف بدون عمولة على الطالب.";
  const canonicalUrl = `${SITE_URL}${seoPage.path}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Navienty",
      locale: "ar_EG",
      type: "website",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

const squadaOne = Squada_One({
  subsets: ["latin"],
  weight: "400",
});

type SearchParams = {
  rental_duration?: string;
  city_id?: string;
  university_id?: string;
  area_id?: string;
  price_range?: string;
  min_price?: string;
  max_price?: string;
  floor?: string;
  lang?: string;
  currency?: string;
  page?: string;
  sort?: string;
  gender?: string;
  amenity_ids?: string;
  season?: string;
  alert?: string;
};

type PageProps = {
  params: Promise<{
    slug: string[];
  }>;
  searchParams: Promise<SearchParams>;
};

type City = {
  id: string | number;
  name_en: string;
  name_ar: string;
};

type University = {
  id: string | number;
  name_en: string;
  name_ar: string;
  city_id: string | number;
};

type PropertyArea = {
  id: string | number;
  city_id: string | number;
  name_en: string;
  name_ar: string;
  is_active?: boolean | null;
};

type UniversityArea = {
  id?: string | number;
  university_id: string | number;
  area_id: string | number;
};

type AmenityOption = {
  id: string;
  name_en: string;
  name_ar: string;
  icon_url?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

type Amenity = {
  id: string;
  name_en: string;
  name_ar: string;
  icon_url?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

type PropertyAmenityLink = {
  amenity_id?: string | number | null;
};

type PropertyImage = {
  image_url?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
};

type PricingSeasonCode = "summer_course" | "academic_year";

type PropertySeasonalPriceRow = {
  property_id?: string | number | null;
  sellable_option_id?: string | null;
  room_sellable_option_id?: string | null;
  price_egp?: number | string | null;
  is_active?: boolean | null;
};

type PropertySellableOption = {
  id?: string | null;
  code?: string | null;
  option_code?: string | null;
  price_egp?: number | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
};

type PropertyRoomSellableOption = {
  id?: string | null;
  code?: string | null;
  price_egp?: number | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
};

type PropertyRoom = {
  is_active?: boolean | null;
  deleted_at?: string | null;
  property_room_sellable_options?: PropertyRoomSellableOption[] | null;
};

type PropertyUniversityLink = {
  university_id?: string | number | null;
};

type PropertyAmenityMatch = {
  property_id_ref?: string | number | null;
  amenity_id?: string | number | null;
};

type Property = {
  id: string | number;
  property_id: string;
  title_en: string;
  title_ar: string;
  price_egp: number;
  rental_duration: string;
  availability_status: string;
  gender?: "boys" | "girls" | string | null;
  city_id?: string | number | null;
  university_id?: string | number | null;
  area_id?: string | number | null;
  floor_number?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_featured?: boolean | null;
  featured_rank?: number | null;
  featured_until?: string | null;
  property_universities?: PropertyUniversityLink[] | null;
  property_images?: PropertyImage[] | null;
  property_sellable_options?: PropertySellableOption[] | null;
  property_rooms?: PropertyRoom[] | null;
  selected_season_prices?: number[] | null;
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

type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
type SupportedLanguage = "en" | "ar";
type SupportedSort =
  "newly_listed" | "lowest_price" | "highest_price" | "boys" | "girls";

type NormalizedGender = "boys" | "girls" | null;

type NormalizedAvailabilityStatus =
  "available" | "reserved" | "unavailable" | "unknown";

type MenuFooterLink = {
  label: string;
  href: string;
  isEmail?: boolean;
};

const FILTER_AMENITY_IDS = [
  "75f3d5b8-647d-4229-8c05-695ac765952b",
  "a732f6a4-cf50-4de1-b2db-5df5dc47e2c1",
  "f5ab16f9-5941-4ebe-96a0-47f19dbe7f05",
  "945a09ce-c3f3-4fb3-a0fd-7c33c939343a",
];

const TRANSLATIONS = {
  en: {
    stay: "stay",
    night: "night",
    month: "month",
    featured: "Elite",
    city: "City",
    university: "University",
    area: "Area",
    duration: "Duration",
    searchCities: "Search cities",
    searchAreas: "Search areas",
    chooseUniversity: "Choose university",
    chooseArea: "Choose area",
    chooseDuration: "Choose duration",
    selectCity: "Select city",
    selectUniversity: "Select university",
    selectArea: "Select area",
    selectDuration: "Select duration",
    anyCity: "Any city",
    anyUniversity: "Any university",
    anyArea: "Any area",
    anyDuration: "Any duration",
    daily: "Daily",
    monthly: "Monthly",
    available: "Available",
    unavailable: "Unavailable",
    reserved: "Reserved",
    boys: "Stays for Boys",
    girls: "Stays for Girls",
    boysMeta: "Boys only",
    girlsMeta: "Girls only",
    startSearch: "Start your search",
    noResults: "No properties found matching your search.",
    alertSuccess:
      "Your request was saved successfully. We will notify you on WhatsApp when a matching stay is available.",
    alertError:
      "Something went wrong while saving your request. Please try again.",
    sortBy: "Sort By",
    season: "Stay period",
    summerCourse: "Summer Course",
    academicYear: "New Academic Year",
    amenities: "Amenities",
    newlyListed: "Newly listed",
    lowestPrice: "Lowest price",
    highestPrice: "Highest price",
    close: "Close",
    backToProperties: "Back to properties",
    login: "Log in or sign up",
    join: "Guide",
    facebook: "Facebook",
    instagram: "Instagram",
    linkedIn: "LinkedIn",
    footerTitle: "Find your way to better student living",
    quickLinks: "Quick Links",
    aboutUs: "About us",
    board: "Board",
    contact: "Contact",
    contactUs: "Contact Us",
    footerEmail: "info@navienty.com",
    explore: "Search",
    community: "Guide",
    account: "Account",
    mobileLogin: "Log in",
    language: "Language",
    english: "English",
    arabic: "العربية",
    copyright: `© ${new Date().getFullYear()} Navienty | All rights reserved.`,
  },
  ar: {
    stay: "إقامة",
    night: "ليلة",
    month: "شهر",
    featured: "إيليت",
    city: "المدينة",
    university: "الجامعة",
    area: "المنطقة",
    duration: "المدة",
    searchCities: "ابحث عن مدينة",
    searchAreas: "ابحث عن منطقة",
    chooseUniversity: "اختر الجامعة",
    chooseArea: "اختر المنطقة",
    chooseDuration: "اختر المدة",
    selectCity: "اختر المدينة",
    selectUniversity: "اختر الجامعة",
    selectArea: "اختر المنطقة",
    selectDuration: "اختر المدة",
    anyCity: "أي مدينة",
    anyUniversity: "أي جامعة",
    anyArea: "أي منطقة",
    anyDuration: "أي مدة",
    daily: "يومي",
    monthly: "شهري",
    available: "متاح",
    unavailable: "غير متاح",
    reserved: "محجوز",
    boys: "منازل للأولاد",
    girls: "منازل للبنات",
    boysMeta: "ولاد فقط",
    girlsMeta: "بنات فقط",
    startSearch: "ابدأ بحثك",
    searchResults: "نتائج البحث",
    noResults: "لم يتم العثور على عقارات تطابق بحثك.",
    alertSuccess:
      "تم تسجيل طلبك بنجاح. أول ما ينزل سكن مناسب هنبلغك على واتساب.",
    alertError: "حصل خطأ أثناء تسجيل طلبك. حاول مرة تانية.",
    sortBy: "ترتيب حسب",
    season: "فترة السكن",
    summerCourse: "السمر كورس",
    academicYear: "السنة الجديدة",
    amenities: "المميزات",
    newlyListed: "الأحدث",
    lowestPrice: "الأقل سعرًا",
    highestPrice: "الأعلى سعرًا",
    close: "إغلاق",
    backToProperties: "الرجوع إلى العقارات",
    login: "سجّل الدخول أو أنشئ حسابًا",
    join: "الدليل",
    facebook: "فيسبوك",
    instagram: "إنستجرام",
    linkedIn: "لينكدإن",
    footerTitle: "نظرة إلى المستقبل.",
    quickLinks: "روابط سريعة",
    aboutUs: "من نحن",
    board: "الإدارة",
    contact: "تواصل معنا",
    contactUs: "تواصل معنا",
    footerEmail: "info@navienty.com",
    explore: "استكشاف",
    community: "الدليل",
    account: "الحساب",
    mobileLogin: "تسجيل الدخول",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    copyright: `© ${new Date().getFullYear()} نافينتي | جميع الحقوق محفوظة.`,
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

function normalizeSort(value?: string): SupportedSort {
  if (value === "lowest_price") return "lowest_price";
  if (value === "highest_price") return "highest_price";
  return "newly_listed";
}

function normalizePricingSeason(
  value?: string | null,
): PricingSeasonCode | null {
  if (value === "summer_course") return "summer_course";
  if (value === "academic_year") return "academic_year";
  return null;
}

function normalizeSelectedGender(
  genderValue?: string | null,
  legacySortValue?: string | null,
): NormalizedGender {
  const normalizedGender = genderValue?.toLowerCase().trim();

  if (normalizedGender === "boys") return "boys";
  if (normalizedGender === "girls") return "girls";

  // Backward compatibility for old URLs that used sort=boys or sort=girls.
  const normalizedLegacySort = legacySortValue?.toLowerCase().trim();

  if (normalizedLegacySort === "boys") return "boys";
  if (normalizedLegacySort === "girls") return "girls";

  return null;
}

function normalizeGender(value?: string | null): NormalizedGender {
  const normalized = value?.toLowerCase().trim();

  if (normalized === "boys") return "boys";
  if (normalized === "girls") return "girls";

  return null;
}

function normalizeAvailabilityStatusForUi(
  status?: string,
): NormalizedAvailabilityStatus {
  const normalized = status
    ?.toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) return "unknown";

  if (
    normalized === "available" ||
    normalized === "partial reserved" ||
    normalized === "partially reserved"
  ) {
    return "available";
  }

  if (
    normalized === "reserved" ||
    normalized === "full reserved" ||
    normalized === "fully reserved"
  ) {
    return "reserved";
  }

  if (normalized === "unavailable" || normalized === "inactive") {
    return "unavailable";
  }

  return "unknown";
}

function translateAvailabilityStatus(
  value: string,
  language: SupportedLanguage,
) {
  const normalized = normalizeAvailabilityStatusForUi(value);

  if (normalized === "available") return TRANSLATIONS[language].available;
  if (normalized === "reserved") return TRANSLATIONS[language].reserved;
  if (normalized === "unavailable") return TRANSLATIONS[language].unavailable;

  return value;
}

function getAvailabilityRank(status?: string) {
  const normalized = normalizeAvailabilityStatusForUi(status);

  if (normalized === "available") return 0;
  if (normalized === "reserved") return 1;
  if (normalized === "unavailable") return 2;
  return 3;
}

function isTruthyFeaturedFlag(value: unknown) {
  if (value === true) return true;

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return (
    normalized === "true" ||
    normalized === "t" ||
    normalized === "1" ||
    normalized === "yes" ||
    normalized === "y"
  );
}

function isPropertyFeatured(property: Property) {
  const featuredRank = Number(property.featured_rank ?? 0);
  const hasFeaturedRank = Number.isFinite(featuredRank) && featuredRank > 0;
  const isFeaturedFlagEnabled = isTruthyFeaturedFlag(property.is_featured);

  if (!isFeaturedFlagEnabled && !hasFeaturedRank) return false;

  if (!property.featured_until) return true;

  const featuredUntilTime = new Date(property.featured_until).getTime();

  // If the property is marked as featured but the date is malformed, keep showing
  // it instead of silently falling back to the old availability ribbon.
  if (!Number.isFinite(featuredUntilTime)) return true;

  return featuredUntilTime > Date.now();
}

function getCreatedAtTime(value?: string | null) {
  if (!value) return 0;

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

type PriceSortDirection = "ascending" | "descending";

function normalizePositivePrice(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    typeof value === "boolean"
  ) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function isUsablePriceOption(option: {
  price_egp?: number | string | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
}) {
  return (
    option.is_active !== false &&
    !option.deleted_at &&
    normalizePositivePrice(option.price_egp) !== null
  );
}

function getDisplayPriceEgp(property: Property): number {
  const selectedSeasonPrices =
    property.selected_season_prices
      ?.map((price) => normalizePositivePrice(price))
      .filter((price): price is number => price !== null) ?? [];

  if (selectedSeasonPrices.length > 0) {
    return Math.min(...selectedSeasonPrices);
  }

  const propertyOptionPrices =
    property.property_sellable_options
      ?.filter(isUsablePriceOption)
      .map((option) => normalizePositivePrice(option.price_egp))
      .filter((price): price is number => price !== null) ?? [];

  const roomOptionPrices =
    property.property_rooms
      ?.filter((room) => room.is_active !== false && !room.deleted_at)
      .flatMap((room) =>
        (room.property_room_sellable_options ?? [])
          .filter(isUsablePriceOption)
          .map((option) => normalizePositivePrice(option.price_egp))
          .filter((price): price is number => price !== null),
      ) ?? [];

  const availableOptionPrices = [...propertyOptionPrices, ...roomOptionPrices];

  // نفس السعر الظاهر على الكارت هو السعر المستخدم في الفلترة والترتيب.
  if (availableOptionPrices.length > 0) {
    return Math.min(...availableOptionPrices);
  }

  return normalizePositivePrice(property.price_egp) ?? 0;
}

function getAllActivePropertyPrices(property: Property): number[] {
  const propertyOptionPrices =
    property.property_sellable_options
      ?.filter(isUsablePriceOption)
      .map((option) => normalizePositivePrice(option.price_egp))
      .filter((price): price is number => price !== null) ?? [];

  const roomOptionPrices =
    property.property_rooms
      ?.filter((room) => room.is_active !== false && !room.deleted_at)
      .flatMap((room) =>
        (room.property_room_sellable_options ?? [])
          .filter(isUsablePriceOption)
          .map((option) => normalizePositivePrice(option.price_egp))
          .filter((price): price is number => price !== null),
      ) ?? [];

  const optionPrices = [...propertyOptionPrices, ...roomOptionPrices];

  if (optionPrices.length > 0) {
    return optionPrices;
  }

  const fallbackPrice = normalizePositivePrice(property.price_egp);

  return fallbackPrice === null ? [] : [fallbackPrice];
}

function getSortablePropertyPrice(property: Property): number | null {
  return normalizePositivePrice(getDisplayPriceEgp(property));
}

function comparePrices(
  aPrice: number | null,
  bPrice: number | null,
  direction: PriceSortDirection,
) {
  // العقارات التي لا تحتوي على سعر صالح تظل في نهاية النتائج.
  if (aPrice === null && bPrice === null) return 0;
  if (aPrice === null) return 1;
  if (bPrice === null) return -1;

  return direction === "ascending" ? aPrice - bPrice : bPrice - aPrice;
}

function comparePropertyTieBreakers(a: Property, b: Property) {
  const availabilityDifference =
    getAvailabilityRank(a.availability_status) -
    getAvailabilityRank(b.availability_status);

  if (availabilityDifference !== 0) {
    return availabilityDifference;
  }

  const aFeatured = isPropertyFeatured(a);
  const bFeatured = isPropertyFeatured(b);

  if (aFeatured !== bFeatured) {
    return aFeatured ? -1 : 1;
  }

  if (aFeatured && bFeatured) {
    const featuredRankDifference =
      Number(b.featured_rank ?? 0) - Number(a.featured_rank ?? 0);

    if (featuredRankDifference !== 0) {
      return featuredRankDifference;
    }
  }

  const createdAtDifference =
    getCreatedAtTime(b.created_at) - getCreatedAtTime(a.created_at);

  if (createdAtDifference !== 0) {
    return createdAtDifference;
  }

  return String(a.property_id || a.id).localeCompare(
    String(b.property_id || b.id),
  );
}

async function getCurrencyRate(currency: SupportedCurrency) {
  if (currency === "EGP") return 1;

  const accessKey = process.env.EXCHANGERATE_API_KEY;
  if (!accessKey) return 1;

  try {
    const cacheBust = Date.now().toString();

    const response = await fetch(
      `https://api.exchangerate.host/live?access_key=${accessKey}&currencies=EGP,${currency}&v=${cacheBust}`,
      { cache: "no-store" },
    );

    const data = await response.json();

    if (data?.success && data?.quotes) {
      const egpFromUsd = data.quotes.USDEGP;
      const targetFromUsd = data.quotes[`USD${currency}`];

      if (
        typeof egpFromUsd === "number" &&
        typeof targetFromUsd === "number" &&
        egpFromUsd > 0
      ) {
        return targetFromUsd / egpFromUsd;
      }
    }

    if (data?.rates?.EGP && data?.rates?.[currency]) {
      const egpRate = data.rates.EGP;
      const targetRate = data.rates[currency];

      if (
        typeof egpRate === "number" &&
        typeof targetRate === "number" &&
        egpRate > 0
      ) {
        return targetRate / egpRate;
      }
    }

    return 1;
  } catch {
    return 1;
  }
}

function formatPrice(
  amountEgp: number,
  currency: SupportedCurrency,
  language: SupportedLanguage,
  rate: number,
) {
  const converted = currency === "EGP" ? amountEgp : amountEgp * rate;
  const locale = language === "ar" ? "ar-EG" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IQD" || currency === "LBP" ? 0 : 2,
  }).format(converted);
}

function normalizeAmenityIds(value?: string) {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeNonNegativeFilterNumber(value?: string | null) {
  if (value === null || value === undefined || value.trim() === "") {
    return null;
  }

  const normalizedValue = Number(value);

  if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
    return null;
  }

  return normalizedValue;
}

function normalizeFloorFilter(value?: string | null) {
  const normalizedValue = normalizeNonNegativeFilterNumber(value);

  if (normalizedValue === null || !Number.isInteger(normalizedValue)) {
    return null;
  }

  return normalizedValue;
}

function normalizePriceFilterBounds(
  minimumValue?: string | null,
  maximumValue?: string | null,
) {
  const minimumPrice = normalizeNonNegativeFilterNumber(minimumValue);
  const maximumPrice = normalizeNonNegativeFilterNumber(maximumValue);

  if (minimumPrice !== null && maximumPrice !== null) {
    return minimumPrice <= maximumPrice
      ? { minimumPrice, maximumPrice }
      : { minimumPrice: maximumPrice, maximumPrice: minimumPrice };
  }

  return { minimumPrice, maximumPrice };
}

function buildVisiblePages(currentPage: number, totalPages: number) {
  const pages: (number | "dots")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (currentPage > 3) pages.push("dots");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push("dots");

  pages.push(totalPages);

  return pages;
}

type PropertyAlertHousingType =
  "single" | "double" | "triple" | "full_apartment";

const PROPERTY_ALERT_HOUSING_TYPES: PropertyAlertHousingType[] = [
  "single",
  "double",
  "triple",
  "full_apartment",
];

function sanitizeUuidLike(value?: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  return normalized.length > 0 ? normalized : null;
}

function sanitizeBudget(value?: FormDataEntryValue | null) {
  const numericValue = Number(String(value ?? "").replace(/[^0-9.]/g, ""));

  return Number.isFinite(numericValue) && numericValue > 0
    ? Math.round(numericValue)
    : null;
}

function sanitizeAnonymousAlertToken(value?: FormDataEntryValue | null) {
  const token = String(value ?? "").trim();

  if (!token) return null;

  return /^[a-zA-Z0-9_-]{12,120}$/.test(token) ? token : null;
}

function normalizePropertyAlertHousingTypes(value?: FormDataEntryValue | null) {
  const values = String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(
    new Set(
      values.filter((item): item is PropertyAlertHousingType =>
        PROPERTY_ALERT_HOUSING_TYPES.includes(item as PropertyAlertHousingType),
      ),
    ),
  );
}

function addAlertStatusToReturnTo(
  returnTo: string,
  status: "success" | "invalid" | "error",
  lang: SupportedLanguage,
  currency: SupportedCurrency,
) {
  const fallback = "/properties/search";
  const safeReturnTo =
    returnTo.startsWith("/sakan/") || returnTo.startsWith("/properties/search")
      ? returnTo
      : fallback;
  const [pathname, queryString = ""] = safeReturnTo.split("?");
  const p = new URLSearchParams(queryString);

  p.set("lang", lang);
  p.set("currency", currency);
  p.set("alert", status);

  return `${pathname}?${p.toString()}`;
}

async function createPropertyAlertRequest(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const currentPath = String(
    formData.get("current_path") ||
      formData.get("return_to") ||
      "/properties/search",
  ).trim();
  const lang = normalizeLanguage(String(formData.get("lang") || "ar"));
  const currency = normalizeCurrency(String(formData.get("currency") || "EGP"));

  const cityId = sanitizeUuidLike(formData.get("city_id"));
  const universityId = sanitizeUuidLike(formData.get("university_id"));
  const areaId = sanitizeUuidLike(formData.get("area_id"));
  const anonymousAlertToken = sanitizeAnonymousAlertToken(
    formData.get("anonymous_alert_token"),
  );
  const housingTypes = normalizePropertyAlertHousingTypes(
    formData.get("housing_types") ?? formData.get("housing_type"),
  );
  const maxBudget = sanitizeBudget(
    formData.get("max_budget") ?? formData.get("max_budget_egp"),
  );

  const redirectWithStatus = (status: "success" | "invalid" | "error") => {
    redirect(addAlertStatusToReturnTo(currentPath, status, lang, currency));
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !anonymousAlertToken) {
    redirectWithStatus("invalid");
  }

  if (
    !cityId ||
    !universityId ||
    !areaId ||
    housingTypes.length === 0 ||
    !maxBudget
  ) {
    redirectWithStatus("invalid");
  }

  const { data: university } = await supabase
    .from("universities")
    .select("id, city_id")
    .eq("id", universityId)
    .maybeSingle();

  if (!university || String(university.city_id) !== cityId) {
    redirectWithStatus("invalid");
  }

  const { data: area } = await supabase
    .from("property_areas")
    .select("id, city_id, is_active")
    .eq("id", areaId)
    .maybeSingle();

  if (!area || area.is_active === false || String(area.city_id) !== cityId) {
    redirectWithStatus("invalid");
  }

  const { data: universityArea } = await supabase
    .from("university_property_areas")
    .select("id")
    .eq("university_id", universityId)
    .eq("area_id", areaId)
    .maybeSingle();

  if (!universityArea) {
    redirectWithStatus("invalid");
  }

  const rows = housingTypes.map((housingType) => ({
    user_id: user?.id ?? null,
    anonymous_alert_token: user ? null : anonymousAlertToken,
    city_id: cityId,
    university_id: universityId,
    area_id: areaId,
    housing_type: housingType,
    max_budget: maxBudget,
    max_budget_egp: maxBudget,
    status: "active",
  }));

  const { error } = await supabase.from("property_alert_requests").insert(rows);

  if (error) {
    console.error("Failed to create property alert request:", error);
    redirectWithStatus("error");
  }

  redirectWithStatus("success");
}

export default async function SakanSeoPage({
  params: routeParams,
  searchParams,
}: PageProps) {
  const { slug } = await routeParams;
  const path = buildPath(slug);
  const { seoPage } = await getCachedSakanPageData(path);

  if (!seoPage) {
    notFound();
  }

  const incomingParams = await searchParams;
  const params: SearchParams = {
    ...incomingParams,
    lang: incomingParams.lang ?? "ar",
    currency: incomingParams.currency ?? "EGP",
    city_id: seoPage.city_id ? String(seoPage.city_id) : incomingParams.city_id,
    university_id: seoPage.university_id
      ? String(seoPage.university_id)
      : incomingParams.university_id,
    area_id: seoPage.area_id ? String(seoPage.area_id) : incomingParams.area_id,
  };

  const shouldIndex =
    seoPage.is_indexable &&
    seoPage.published_properties_count >= MIN_INDEXABLE_RESULTS;
  const seoH1 = seoPage.seo_h1_ar || seoPage.entity_name_ar || "سكن الطلاب";
  const seoIntro =
    seoPage.seo_intro_ar ||
    "Navienty يساعدك على اكتشاف ومقارنة أماكن السكن الطلابي والتواصل مع المضيفين بسهولة، بدون أي عمولة على الطالب.";
  const seoFaqItems = Array.isArray(seoPage.seo_faq_ar)
    ? seoPage.seo_faq_ar.filter((item: any) => item?.q && item?.a)
    : [];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "الرئيسية",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "سكن الطلاب",
        item: `${SITE_URL}/sakan/asyut`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: seoH1,
        item: `${SITE_URL}${seoPage.path}`,
      },
    ],
  };

  const faqJsonLd =
    seoFaqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: seoFaqItems.map((item: any) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;
  const selectedLanguage = normalizeLanguage(params.lang);
  const selectedCurrency = normalizeCurrency(params.currency);
  const selectedSort = normalizeSort(params.sort);
  const selectedSeason = normalizePricingSeason(params.season);
  const selectedGender = normalizeSelectedGender(params.gender, params.sort);
  const selectedAmenityIds = normalizeAmenityIds(params.amenity_ids);
  const selectedPriceBounds = normalizePriceFilterBounds(
    params.min_price,
    params.max_price,
  );
  const selectedMinimumPriceEgp = selectedPriceBounds.minimumPrice;
  const selectedMaximumPriceEgp = selectedPriceBounds.maximumPrice;
  const selectedFloor = normalizeFloorFilter(params.floor);
  const t = TRANSLATIONS[selectedLanguage];
  const isArabic = selectedLanguage === "ar";
  const currencyRate = await getCurrencyRate(selectedCurrency);

  // أقل عدد كروت على الصفحة = Scroll أخف على الموبايل
  const PAGE_SIZE = 24;

  const currentPage = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  /*
    إحصائيات GEO تُحسب من صفحة الـCanonical نفسها فقط.
    لذلك لا تتأثر بفلتر السعر أو النوع أو الدور أو الموسم أو الترتيب
    الذي يختاره الزائر داخل الصفحة.
  */
  const canonicalStatsSelect = `
      id,
      property_id,
      title_en,
      title_ar,
      price_egp,
      availability_status,
      city_id,
      university_id,
      area_id,
      updated_at,
      property_sellable_options(
        id,
        code,
        option_code,
        price_egp,
        is_active,
        deleted_at
      ),
      property_rooms(
        is_active,
        deleted_at,
        property_room_sellable_options(
          id,
          code,
          price_egp,
          is_active,
          deleted_at
        )
      ),
      ${
        seoPage.university_id
          ? "property_universities!inner(university_id)"
          : "property_universities(university_id)"
      }
    `;

  let canonicalStatsQuery = supabase
    .from("properties")
    .select(canonicalStatsSelect)
    .eq("admin_status", "published")
    .eq("is_active", true)
    .neq("availability_status", "unavailable")
    .neq("availability_status", "inactive")
    .limit(5000);

  if (seoPage.city_id) {
    canonicalStatsQuery = canonicalStatsQuery.eq(
      "city_id",
      String(seoPage.city_id),
    );
  }

  if (seoPage.university_id) {
    canonicalStatsQuery = canonicalStatsQuery.eq(
      "property_universities.university_id",
      String(seoPage.university_id),
    );
  }

  if (seoPage.area_id) {
    canonicalStatsQuery = canonicalStatsQuery.eq(
      "area_id",
      String(seoPage.area_id),
    );
  }

  const {
    data: canonicalStatsData,
    error: canonicalStatsError,
  } = await canonicalStatsQuery;

  if (canonicalStatsError) {
    console.error(
      "Failed to load canonical GEO statistics:",
      canonicalStatsError.message,
    );
  }

  const canonicalStatsProperties =
    !canonicalStatsError && Array.isArray(canonicalStatsData)
      ? (canonicalStatsData as unknown as Property[])
      : [];

  const canonicalStatsTotal = canonicalStatsError
    ? Number(seoPage.published_properties_count ?? 0)
    : canonicalStatsProperties.length;

  const canonicalStatsAvailable = canonicalStatsProperties.filter(
    (property) =>
      normalizeAvailabilityStatusForUi(property.availability_status) ===
      "available",
  ).length;

  const canonicalStatsReserved = canonicalStatsProperties.filter(
    (property) =>
      normalizeAvailabilityStatusForUi(property.availability_status) ===
      "reserved",
  ).length;

  const canonicalStatsPrices = canonicalStatsProperties
    .flatMap((property) => getAllActivePropertyPrices(property))
    .filter((price) => Number.isFinite(price) && price > 0);

  const canonicalStatsMinPrice =
    canonicalStatsPrices.length > 0
      ? Math.min(...canonicalStatsPrices)
      : null;

  const canonicalStatsMaxPrice =
    canonicalStatsPrices.length > 0
      ? Math.max(...canonicalStatsPrices)
      : null;

  const latestPropertyUpdateTimestamp = canonicalStatsProperties.reduce(
    (latestTimestamp, property) => {
      const timestamp = property.updated_at
        ? new Date(property.updated_at).getTime()
        : Number.NaN;

      return Number.isFinite(timestamp)
        ? Math.max(latestTimestamp, timestamp)
        : latestTimestamp;
    },
    0,
  );

  const seoUpdatedTimestamp = seoPage.seo_updated_at
    ? new Date(seoPage.seo_updated_at).getTime()
    : Number.NaN;

  const canonicalStatsUpdatedTimestamp = Math.max(
    latestPropertyUpdateTimestamp,
    Number.isFinite(seoUpdatedTimestamp) ? seoUpdatedTimestamp : 0,
  );

  const canonicalStatsUpdatedAt =
    canonicalStatsUpdatedTimestamp > 0
      ? new Date(canonicalStatsUpdatedTimestamp)
      : null;

  const canonicalStatsNumberFormatter = new Intl.NumberFormat(
    selectedLanguage === "ar" ? "ar-EG" : "en-US",
  );

  const canonicalStatsPriceFormatter = new Intl.NumberFormat(
    selectedLanguage === "ar" ? "ar-EG" : "en-US",
    {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    },
  );

  const canonicalStatsDateFormatter = new Intl.DateTimeFormat(
    selectedLanguage === "ar" ? "ar-EG" : "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Cairo",
    },
  );

  const formattedCanonicalStatsTotal =
    canonicalStatsNumberFormatter.format(canonicalStatsTotal);

  const formattedCanonicalStatsAvailable =
    canonicalStatsNumberFormatter.format(canonicalStatsAvailable);

  const formattedCanonicalStatsReserved =
    canonicalStatsNumberFormatter.format(canonicalStatsReserved);

  const formattedCanonicalStatsMinPrice =
    canonicalStatsMinPrice !== null
      ? canonicalStatsPriceFormatter.format(canonicalStatsMinPrice)
      : null;

  const formattedCanonicalStatsMaxPrice =
    canonicalStatsMaxPrice !== null
      ? canonicalStatsPriceFormatter.format(canonicalStatsMaxPrice)
      : null;

  const formattedCanonicalStatsUpdatedAt = canonicalStatsUpdatedAt
    ? canonicalStatsDateFormatter.format(canonicalStatsUpdatedAt)
    : null;

  const seoStatsSummary =
    selectedLanguage === "ar"
      ? formattedCanonicalStatsMinPrice &&
        formattedCanonicalStatsMaxPrice
        ? canonicalStatsMinPrice === canonicalStatsMaxPrice
          ? `تضم هذه الصفحة حاليًا ${formattedCanonicalStatsTotal} وحدة سكنية منشورة على Navienty، وتبدأ الأسعار المعلنة من ${formattedCanonicalStatsMinPrice}.`
          : `تضم هذه الصفحة حاليًا ${formattedCanonicalStatsTotal} وحدة سكنية منشورة على Navienty، وتتراوح الأسعار المعلنة بين ${formattedCanonicalStatsMinPrice} و${formattedCanonicalStatsMaxPrice}.`
        : `تضم هذه الصفحة حاليًا ${formattedCanonicalStatsTotal} وحدة سكنية منشورة على Navienty.`
      : formattedCanonicalStatsMinPrice &&
          formattedCanonicalStatsMaxPrice
        ? canonicalStatsMinPrice === canonicalStatsMaxPrice
          ? `This page currently includes ${formattedCanonicalStatsTotal} published student housing listing on Navienty, with advertised prices starting from ${formattedCanonicalStatsMinPrice}.`
          : `This page currently includes ${formattedCanonicalStatsTotal} published student housing listings on Navienty, with advertised prices ranging from ${formattedCanonicalStatsMinPrice} to ${formattedCanonicalStatsMaxPrice}.`
        : `This page currently includes ${formattedCanonicalStatsTotal} published student housing listings on Navienty.`;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}${seoPage.path}#collection`,
    name: seoH1,
    description: `${seoPage.seo_description_ar || "صفحة تجمع أماكن سكن طلابية مناسبة على Navienty."} ${seoStatsSummary}`,
    url: `${SITE_URL}${seoPage.path}`,
    inLanguage: "ar-EG",
    ...(canonicalStatsUpdatedAt
      ? { dateModified: canonicalStatsUpdatedAt.toISOString() }
      : {}),
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Navienty",
      url: SITE_URL,
    },
    provider: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Navienty",
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: canonicalStatsTotal,
      itemListElement: canonicalStatsProperties
        .slice(0, 100)
        .map((property, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}/properties/${property.property_id}`,
          name:
            property.title_ar ||
            property.title_en ||
            `سكن طلاب ${property.property_id}`,
        })),
    },
  };

  const { data: cities } = await supabase
    .from("cities")
    .select("id, name_en, name_ar")
    .order("name_en", { ascending: true });

  const { data: universities } = await supabase
    .from("universities")
    .select("id, name_en, name_ar, city_id")
    .order("name_en", { ascending: true });

  const { data: areas } = await supabase
    .from("property_areas")
    .select("id, city_id, name_en, name_ar, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });

  const { data: universityAreas } = await supabase
    .from("university_property_areas")
    .select("id, university_id, area_id");

  const { data: amenities } = await supabase
    .from("amenities")
    .select("id, name_en, name_ar, icon_url, sort_order, is_active")
    .eq("is_active", true)
    .in("id", FILTER_AMENITY_IDS)
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });

  let matchingPropertyIdsByAmenities: string[] | null = null;

  if (selectedAmenityIds.length > 0) {
    const { data: amenityMatches } = await supabase
      .from("property_amenities")
      .select("property_id_ref, amenity_id")
      .in("amenity_id", selectedAmenityIds);

    const amenityIdsByProperty = new Map<string, Set<string>>();

    for (const item of (amenityMatches as PropertyAmenityMatch[]) ?? []) {
      if (!item.property_id_ref || !item.amenity_id) continue;

      const propertyId = String(item.property_id_ref);
      const amenityId = String(item.amenity_id);
      const existingAmenityIds =
        amenityIdsByProperty.get(propertyId) ?? new Set<string>();

      existingAmenityIds.add(amenityId);
      amenityIdsByProperty.set(propertyId, existingAmenityIds);
    }

    matchingPropertyIdsByAmenities = Array.from(amenityIdsByProperty.entries())
      .filter(([, propertyAmenityIds]) =>
        selectedAmenityIds.every((amenityId) =>
          propertyAmenityIds.has(amenityId),
        ),
      )
      .map(([propertyId]) => propertyId);
  }

  let query = supabase
    .from("properties")
    .select(
      `
      id,
      property_id,
      title_en,
      title_ar,
      price_egp,
      rental_duration,
      availability_status,
      gender,
      city_id,
      university_id,
      area_id,
      floor_number,
      latitude,
      longitude,
      created_at,
      is_featured,
      featured_rank,
      featured_until,
      property_universities!inner(
        university_id
      ),
      property_images(
        image_url,
        is_cover,
        sort_order
      ),
      property_sellable_options(
        id,
        code,
        option_code,
        price_egp,
        is_active,
        deleted_at
      ),
      property_rooms(
        is_active,
        deleted_at,
        property_room_sellable_options(
          id,
          code,
          price_egp,
          is_active,
          deleted_at
        )
      )
    `,
    )
    .eq("admin_status", "published")
    .eq("is_active", true)
    .neq("availability_status", "unavailable");

  if (params.city_id) query = query.eq("city_id", params.city_id);

  if (params.university_id) {
    query = query.eq(
      "property_universities.university_id",
      params.university_id,
    );
  }

  if (params.area_id) query = query.eq("area_id", params.area_id);

  if (selectedFloor !== null) {
    query = query.eq("floor_number", selectedFloor);
  }

  if (params.rental_duration) {
    query = query.eq("rental_duration", params.rental_duration);
  }

  if (selectedGender) {
    query = query.eq("gender", selectedGender);
  }

  if (matchingPropertyIdsByAmenities) {
    query =
      matchingPropertyIdsByAmenities.length > 0
        ? query.in("id", matchingPropertyIdsByAmenities)
        : query.in("id", ["00000000-0000-0000-0000-000000000000"]);
  }

  query = query.order("created_at", { ascending: false });

  const { data: properties } = await query;

  const loadedProperties = (properties as Property[]) ?? [];
  let propertiesForFiltering = loadedProperties;

  /*
    عند اختيار فترة السكن، نظهر فقط العقارات التي لديها سعر فعال
    للفترة المختارة. كما نستخدم سعر هذه الفترة في الكارت والفلترة والـSort.
  */
  if (selectedSeason) {
    /*
      نحمّل الموسم والأسعار الموسمية من الجداول الفعلية.
      مهم: لو القراءة مُنعت بسبب RLS أو لم تعد بيانات الموسم متاحة،
      لا نخفي كل العقارات. نرجع للأسعار الأساسية بدل شاشة نتائج فارغة.
    */
    const { data: selectedPricingSeasons, error: pricingSeasonsError } =
      await supabase
        .from("property_pricing_seasons")
        .select("id, code, is_active")
        .eq("code", selectedSeason)
        .eq("is_active", true);

    if (pricingSeasonsError) {
      console.error(
        "Failed to load selected pricing seasons:",
        pricingSeasonsError.message,
      );
    }

    const selectedSeasonIds = Array.from(
      new Set(
        ((selectedPricingSeasons as { id?: string | null }[]) ?? [])
          .map((season) => String(season.id ?? "").trim())
          .filter(Boolean),
      ),
    );

    const propertyIds = loadedProperties.map((property) => String(property.id));
    let selectedSeasonalPriceRows: PropertySeasonalPriceRow[] = [];
    let seasonalPricesReadSucceeded = false;

    if (
      !pricingSeasonsError &&
      selectedSeasonIds.length > 0 &&
      propertyIds.length > 0
    ) {
      const { data: seasonalPriceRows, error: seasonalPricesError } =
        await supabase
          .from("property_option_seasonal_prices")
          .select(
            "property_id, sellable_option_id, room_sellable_option_id, price_egp, is_active",
          )
          .in("season_id", selectedSeasonIds)
          .eq("is_active", true)
          .in("property_id", propertyIds);

      if (seasonalPricesError) {
        console.error(
          "Failed to load seasonal property prices:",
          seasonalPricesError.message,
        );
      } else {
        seasonalPricesReadSucceeded = true;
        selectedSeasonalPriceRows =
          (seasonalPriceRows as PropertySeasonalPriceRow[]) ?? [];
      }
    }

    const activePropertyOptionIdsByPropertyId = new Map<string, Set<string>>();
    const activeRoomOptionIdsByPropertyId = new Map<string, Set<string>>();

    for (const property of loadedProperties) {
      const propertyId = String(property.id);
      const activePropertyOptionIds = new Set(
        (property.property_sellable_options ?? [])
          .filter((option) => option.is_active !== false && !option.deleted_at)
          .map((option) => String(option.id ?? "").trim())
          .filter(Boolean),
      );
      const activeRoomOptionIds = new Set(
        (property.property_rooms ?? [])
          .filter((room) => room.is_active !== false && !room.deleted_at)
          .flatMap((room) => room.property_room_sellable_options ?? [])
          .filter((option) => option.is_active !== false && !option.deleted_at)
          .map((option) => String(option.id ?? "").trim())
          .filter(Boolean),
      );

      activePropertyOptionIdsByPropertyId.set(
        propertyId,
        activePropertyOptionIds,
      );
      activeRoomOptionIdsByPropertyId.set(propertyId, activeRoomOptionIds);
    }

    const seasonalPricesByPropertyId = new Map<string, number[]>();

    for (const row of selectedSeasonalPriceRows) {
      if (!row.property_id || row.is_active === false) continue;

      const propertyId = String(row.property_id);
      const price = normalizePositivePrice(row.price_egp);
      if (price === null) continue;

      const propertyOptionId = String(row.sellable_option_id ?? "").trim();
      const roomOptionId = String(row.room_sellable_option_id ?? "").trim();

      const hasNoOptionLink = !propertyOptionId && !roomOptionId;
      const belongsToActivePropertyOption = Boolean(
        propertyOptionId &&
          activePropertyOptionIdsByPropertyId
            .get(propertyId)
            ?.has(propertyOptionId),
      );
      const belongsToActiveRoomOption = Boolean(
        roomOptionId &&
          activeRoomOptionIdsByPropertyId.get(propertyId)?.has(roomOptionId),
      );

      /*
        نقبل الصف إذا كان مرتبطًا بخيار فعال، أو إذا كان من البيانات القديمة
        ومرتبطًا بالعقار مباشرة من غير option id.
      */
      if (
        !hasNoOptionLink &&
        !belongsToActivePropertyOption &&
        !belongsToActiveRoomOption
      ) {
        continue;
      }

      const currentPrices = seasonalPricesByPropertyId.get(propertyId) ?? [];
      currentPrices.push(price);
      seasonalPricesByPropertyId.set(propertyId, currentPrices);
    }

    if (seasonalPricesByPropertyId.size > 0) {
      propertiesForFiltering = loadedProperties
        .map((property) => ({
          ...property,
          selected_season_prices:
            seasonalPricesByPropertyId.get(String(property.id)) ?? [],
        }))
        .filter(
          (property) => (property.selected_season_prices?.length ?? 0) > 0,
        );
    } else {
      /*
        Fail-open fallback:
        منع RLS أو عدم وجود rows لا يجب أن يحوّل الصفحة كلها إلى صفر نتائج.
        في الحالة دي نُبقي العقارات ونستخدم أقل سعر أساسي متاح.
      */
      if (selectedSeasonIds.length === 0) {
        console.warn(
          `No active pricing season found for code: ${selectedSeason}`,
        );
      } else if (seasonalPricesReadSucceeded) {
        console.warn(
          `No readable seasonal prices found for season: ${selectedSeason}`,
        );
      }

      propertiesForFiltering = loadedProperties;
    }
  }

  /*
    فلتر السعر يتم بعد جلب خيارات العقار والغرف لأن السعر الصحيح
    هو نفس أقل سعر فعلي ظاهر على الكارت، وليس properties.price_egp فقط.
  */
  const priceFilteredProperties = propertiesForFiltering.filter((property) => {
    if (selectedMinimumPriceEgp === null && selectedMaximumPriceEgp === null) {
      return true;
    }

    const propertyPrice = getSortablePropertyPrice(property);

    if (propertyPrice === null) {
      return false;
    }

    if (
      selectedMinimumPriceEgp !== null &&
      propertyPrice < selectedMinimumPriceEgp
    ) {
      return false;
    }

    if (
      selectedMaximumPriceEgp !== null &&
      propertyPrice > selectedMaximumPriceEgp
    ) {
      return false;
    }

    return true;
  });

  const allSortedProperties = [...priceFilteredProperties].sort((a, b) => {
    const aDisplayPrice = getSortablePropertyPrice(a);
    const bDisplayPrice = getSortablePropertyPrice(b);

    // في ترتيب السعر، السعر نفسه هو العامل الأساسي.
    if (selectedSort === "lowest_price") {
      const priceDifference = comparePrices(
        aDisplayPrice,
        bDisplayPrice,
        "ascending",
      );

      if (priceDifference !== 0) return priceDifference;

      return comparePropertyTieBreakers(a, b);
    }

    if (selectedSort === "highest_price") {
      const priceDifference = comparePrices(
        aDisplayPrice,
        bDisplayPrice,
        "descending",
      );

      if (priceDifference !== 0) return priceDifference;

      return comparePropertyTieBreakers(a, b);
    }

    // في ترتيب الأحدث نحافظ على أولوية العقارات المميزة.
    const aFeatured = isPropertyFeatured(a);
    const bFeatured = isPropertyFeatured(b);

    if (aFeatured !== bFeatured) {
      return aFeatured ? -1 : 1;
    }

    if (aFeatured && bFeatured) {
      const featuredRankDifference =
        Number(b.featured_rank ?? 0) - Number(a.featured_rank ?? 0);

      if (featuredRankDifference !== 0) {
        return featuredRankDifference;
      }
    }

    const availabilityDifference =
      getAvailabilityRank(a.availability_status) -
      getAvailabilityRank(b.availability_status);

    if (availabilityDifference !== 0) {
      return availabilityDifference;
    }

    const createdAtDifference =
      getCreatedAtTime(b.created_at) - getCreatedAtTime(a.created_at);

    if (createdAtDifference !== 0) {
      return createdAtDifference;
    }

    return String(a.property_id || a.id).localeCompare(
      String(b.property_id || b.id),
    );
  });

  const sortedProperties = allSortedProperties.slice(from, to);
  const count = allSortedProperties.length;
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0;
  const visiblePages = buildVisiblePages(currentPage, totalPages);
  const formattedHomesCount = new Intl.NumberFormat(
    selectedLanguage === "ar" ? "ar-EG" : "en-US",
  ).format(count);
  const mobileMapHomesLabel =
    selectedLanguage === "ar"
      ? `أكثر من ${formattedHomesCount} سكن`
      : `Over ${formattedHomesCount} homes`;

  const buildPropertiesPageLink = () => {
    const p = new URLSearchParams();
    p.set("lang", selectedLanguage);
    p.set("currency", selectedCurrency);
    return `/properties?${p.toString()}`;
  };

  const buildSimpleNavLink = (path: string) => {
    const p = new URLSearchParams();
    p.set("lang", selectedLanguage);
    p.set("currency", selectedCurrency);
    return `${path}?${p.toString()}`;
  };

  const buildPropertyHref = (propertyId: string) => {
    const p = new URLSearchParams();
    p.set("lang", selectedLanguage);
    p.set("currency", selectedCurrency);

    if (selectedSeason) {
      p.set("season", selectedSeason);
    }

    return `/properties/${propertyId}?${p.toString()}`;
  };

  const buildPageLink = (pageNumber: number) => {
    const p = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "sort" && key !== "gender") {
        p.set(key, value);
      }
    });

    p.set("lang", selectedLanguage);
    p.set("currency", selectedCurrency);
    p.set("sort", selectedSort);

    if (selectedGender) {
      p.set("gender", selectedGender);
    }

    p.set("page", pageNumber.toString());

    return `${seoPage.path}?${p.toString()}`;
  };

  const buildSearchPageLink = (updates: Partial<SearchParams> = {}) => {
    const p = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value) p.set(key, value);
    });

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        p.set(key, value);
      } else {
        p.delete(key);
      }
    });

    p.set("lang", updates.lang ?? selectedLanguage);
    p.set("currency", updates.currency ?? selectedCurrency);

    return `${seoPage.path}?${p.toString()}`;
  };

  const buildAlertReturnTo = () => {
    const p = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== "alert") {
        p.set(key, value);
      }
    });

    p.set("lang", selectedLanguage);
    p.set("currency", selectedCurrency);

    return `${seoPage.path}?${p.toString()}`;
  };

  const buildSortLink = (sortValue: SupportedSort) => {
    const p = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "sort" && key !== "gender") {
        p.set(key, value);
      }
    });

    p.set("lang", selectedLanguage);
    p.set("currency", selectedCurrency);

    if (sortValue === "boys" || sortValue === "girls") {
      p.set("gender", sortValue);
      p.set("sort", selectedSort);
    } else {
      p.set("sort", sortValue);

      if (selectedGender) {
        p.set("gender", selectedGender);
      }
    }

    return `${seoPage.path}?${p.toString()}`;
  };

  const sortOptions = [
    {
      value: "newly_listed" as SupportedSort,
      label: t.newlyListed,
      href: buildSortLink("newly_listed"),
    },
    {
      value: "lowest_price" as SupportedSort,
      label: t.lowestPrice,
      href: buildSortLink("lowest_price"),
    },
    {
      value: "highest_price" as SupportedSort,
      label: t.highestPrice,
      href: buildSortLink("highest_price"),
    },
    {
      value: "boys" as SupportedSort,
      label: t.boys,
      href: buildSortLink("boys"),
    },
    {
      value: "girls" as SupportedSort,
      label: t.girls,
      href: buildSortLink("girls"),
    },
  ];

  const primaryMenuLinks = [
    {
      label: isLoggedIn ? t.account : t.login,
      href: isLoggedIn
        ? buildSimpleNavLink("/account")
        : buildSimpleNavLink("/login"),
    },
    { label: t.join, href: buildSimpleNavLink("/community") },
  ];

  const socialMenuLinks = [
    { label: t.facebook, href: "https://www.facebook.com/" },
    { label: t.instagram, href: "https://www.instagram.com/" },
    { label: t.linkedIn, href: "https://www.linkedin.com/" },
  ];

  const footerQuickLinks = [
    { label: t.aboutUs, href: buildSimpleNavLink("/about") },
    { label: t.board, href: buildSimpleNavLink("/board") },
    { label: t.contact, href: buildSimpleNavLink("/contact") },
  ];

  const menuFooterLinks: MenuFooterLink[] = [
    ...footerQuickLinks,
    { label: t.footerEmail, href: `mailto:${t.footerEmail}`, isEmail: true },
  ];

  const backToPropertiesHref = buildPropertiesPageLink();

  const searchBarProps = {
    cities: (cities as City[]) ?? [],
    universities: (universities as University[]) ?? [],
    areas: (areas as PropertyArea[]) ?? [],
    universityAreas: (universityAreas as UniversityArea[]) ?? [],
    initialCityId: params.city_id ?? "",
    initialUniversityId: params.university_id ?? "",
    initialAreaId: params.area_id ?? "",
    initialRentalDuration: params.rental_duration ?? "",
    initialPriceRange: params.price_range ?? "",
    language: selectedLanguage,
    currency: selectedCurrency,
    locationMode: "city-area" as const,
    labels: {
      city: t.city,
      university: t.university,
      area: t.area,
      duration: t.duration,
      searchCities: t.searchCities,
      searchAreas: t.searchAreas,
      chooseUniversity: t.chooseUniversity,
      chooseArea: t.chooseArea,
      chooseDuration: t.chooseDuration,
      selectCity: t.selectCity,
      selectUniversity: t.selectUniversity,
      selectArea: t.selectArea,
      selectDuration: t.selectDuration,
      anyCity: t.anyCity,
      anyUniversity: t.anyUniversity,
      anyArea: t.anyArea,
      anyDuration: t.anyDuration,
      daily: t.daily,
      monthly: t.monthly,
    },
    mobileHeaderStartSlot: (
      <Link
        href={backToPropertiesHref}
        aria-label={t.backToProperties}
        className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[#dddddd] bg-white text-[#111827] shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition hover:bg-[#f8fafc] dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-100 dark:shadow-[0_8px_20px_rgba(0,0,0,0.28)] dark:hover:bg-[#111827]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.2}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={
              isArabic
                ? "m8.25 4.5 7.5 7.5-7.5 7.5"
                : "M15.75 19.5 8.25 12l7.5-7.5"
            }
          />
        </svg>
      </Link>
    ),
    mobileHeaderEndSlot: (
      <SortDropdown
        isArabic={isArabic}
        selectedSort={selectedSort}
        showSeasonFilter
        sortByLabel={t.sortBy}
        seasonLabel={t.season}
        summerCourseLabel={t.summerCourse}
        academicYearLabel={t.academicYear}
        amenitiesLabel={t.amenities}
        options={sortOptions}
        amenities={(amenities as Amenity[]) ?? []}
        selectedCurrency={selectedCurrency}
        currencyRate={currencyRate}
      />
    ),
    mobileSearchBarClassName: "mt-0",
  };

  const alertStatus =
    params.alert === "success" ||
    params.alert === "invalid" ||
    params.alert === "error" ||
    params.alert === "login_required"
      ? params.alert
      : undefined;

  const nextMobileLanguage: SupportedLanguage =
    selectedLanguage === "ar" ? "en" : "ar";
  const mobileLanguageHref = buildSearchPageLink({ lang: nextMobileLanguage });
  const mobileLanguageLabel = selectedLanguage === "ar" ? t.english : t.arabic;
  const mobileLanguageAriaLabel =
    selectedLanguage === "ar"
      ? "Switch language to English"
      : "تغيير اللغة إلى العربية";

  const getPropertyImages = (property: Property) => {
    const validImages =
      property.property_images
        ?.map((item, index) => ({
          imageUrl: item?.image_url?.trim() ?? "",
          isCover: item?.is_cover === true,
          sortOrder:
            typeof item?.sort_order === "number"
              ? item.sort_order
              : Number.POSITIVE_INFINITY,
          originalIndex: index,
        }))
        .filter((item) => Boolean(item.imageUrl)) ?? [];

    if (validImages.length === 0) {
      return [];
    }

    return validImages
      .sort((a, b) => {
        if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;

        const sortOrderDiff = a.sortOrder - b.sortOrder;
        if (sortOrderDiff !== 0) return sortOrderDiff;

        return a.originalIndex - b.originalIndex;
      })
      .map((item) => item.imageUrl);
  };

  const mapProperties = allSortedProperties
    .map((property) => {
      const hasLatitude =
        property.latitude !== null &&
        property.latitude !== undefined &&
        String(property.latitude).trim() !== "";

      const hasLongitude =
        property.longitude !== null &&
        property.longitude !== undefined &&
        String(property.longitude).trim() !== "";

      if (!hasLatitude || !hasLongitude) {
        return null;
      }

      const latitude = Number(property.latitude);
      const longitude = Number(property.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      const displayPriceEgp = getDisplayPriceEgp(property);

      return {
        id: String(property.id),
        propertyId: property.property_id,
        title: isArabic ? property.title_ar : property.title_en,
        href: buildPropertyHref(property.property_id),
        priceLabel: formatPrice(
          displayPriceEgp,
          selectedCurrency,
          selectedLanguage,
          currencyRate,
        ),
        latitude,
        longitude,
        imageUrl: getPropertyImages(property)[0] ?? null,
        imageUrls: getPropertyImages(property),
      };
    })
    .filter((property): property is NonNullable<typeof property> =>
      Boolean(property),
    );

  const renderPropertyImage = (property: Property, badgeText: string) => {
    const images = getPropertyImages(property);
    const normalizedStatus = normalizeAvailabilityStatusForUi(
      property.availability_status,
    );

    const isReserved = normalizedStatus === "reserved";
    const propertyTitle = isArabic ? property.title_ar : property.title_en;
    const propertyIsFeatured = isPropertyFeatured(property);

    return (
      <div className="property-media-card group/image relative aspect-[4/3] overflow-hidden rounded-[18px] bg-gray-100 shadow-[0_6px_18px_rgba(15,23,42,0.08)] dark:bg-slate-800 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] md:rounded-[28px] md:shadow-[0_10px_30px_rgba(15,23,42,0.10)]">
        <PropertyImageSlider
          images={images}
          title={propertyTitle}
          propertyId={property.id}
        />

        <div className="property-media-gradient pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/14 via-black/4 to-transparent md:h-20" />

        {propertyIsFeatured && (
          <div className="featured-badge">
            <span className="featured-badge__icon" aria-hidden="true">
              <img
                src="/icons/king-crown.png"
                alt=""
                className="featured-badge__icon-image"
              />
            </span>
            <span className="featured-badge__text">{t.featured}</span>
          </div>
        )}

        {!propertyIsFeatured && isReserved && (
          <div className="status-ribbon status-ribbon--reserved">
            <span className="status-ribbon__inner">{badgeText}</span>
          </div>
        )}
      </div>
    );
  };

  const renderGenderMeta = (property: Property) => {
    const gender = normalizeGender(property.gender);

    if (!gender) return null;

    const label = gender === "boys" ? t.boysMeta : t.girlsMeta;

    return <span className="property-meta-gender">{label}</span>;
  };

  const renderPropertyCard = (property: Property) => {
    const displayPriceEgp = getDisplayPriceEgp(property);

    return (
      <Link
        key={property.id}
        href={buildPropertyHref(property.property_id)}
        className="property-card group block"
      >
        {renderPropertyImage(
          property,
          isPropertyFeatured(property)
            ? t.featured
            : translateAvailabilityStatus(
                property.availability_status,
                selectedLanguage,
              ),
        )}

        <div className="mt-2.5 space-y-1 md:mt-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug tracking-[-0.02em] text-slate-900 dark:text-slate-100 md:text-[17px]">
              {isArabic ? property.title_ar : property.title_en}
            </h3>
          </div>

          {renderGenderMeta(property) && (
            <div className="flex min-w-0 items-center text-[12px] text-slate-500 dark:text-slate-400 md:text-[13px]">
              {renderGenderMeta(property)}
            </div>
          )}

          <p className="truncate pt-0.5 text-[13px] md:pt-1 md:text-[14px]">
            <span className="font-semibold text-slate-950 dark:text-white">
              {formatPrice(
                displayPriceEgp,
                selectedCurrency,
                selectedLanguage,
                currencyRate,
              )}
            </span>{" "}
            <span className="text-[11px] text-slate-500 dark:text-slate-400 md:text-[12px]">
              / {property.rental_duration === "daily" ? t.night : t.month}
            </span>
          </p>
        </div>
      </Link>
    );
  };

  const renderPagination = (className = "") => {
    if (totalPages <= 1) return null;

    const previousPageDisabled = currentPage === 1;
    const nextPageDisabled = currentPage === totalPages;

    return (
      <div
        className={`mt-10 flex items-center justify-center gap-24 py-4 md:mt-16 md:gap-2 ${className}`}
        dir="ltr"
      >
        <Link
          href={buildPageLink(currentPage - 1)}
          aria-disabled={previousPageDisabled}
          className={`flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-[#111827] shadow-[0_8px_24px_rgba(15,23,42,0.14)] transition md:h-10 md:w-10 md:border-0 md:bg-transparent md:text-[#054aff] md:shadow-none ${
            previousPageDisabled
              ? "pointer-events-none opacity-30 hover:bg-transparent"
              : "hover:bg-slate-50 md:hover:bg-[#054aff]/10"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </Link>

        <div className="hidden items-center gap-2 md:flex md:gap-3">
          {visiblePages.map((item, index) =>
            item === "dots" ? (
              <span
                key={`dots-${index}`}
                className="flex h-10 min-w-[24px] items-center justify-center text-[18px] font-semibold text-[#054aff]"
              >
                ...
              </span>
            ) : (
              <Link
                key={item}
                href={buildPageLink(item)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-[16px] font-semibold transition ${
                  currentPage === item
                    ? "bg-[#054aff] text-white"
                    : "text-[#054aff] hover:bg-[#054aff]/10"
                }`}
              >
                {item}
              </Link>
            ),
          )}
        </div>

        <Link
          href={buildPageLink(currentPage + 1)}
          aria-disabled={nextPageDisabled}
          className={`flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-[#111827] shadow-[0_8px_24px_rgba(15,23,42,0.14)] transition md:h-10 md:w-10 md:border-0 md:bg-transparent md:text-[#054aff] md:shadow-none ${
            nextPageDisabled
              ? "pointer-events-none opacity-30 hover:bg-transparent"
              : "hover:bg-slate-50 md:hover:bg-[#054aff]/10"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </Link>
      </div>
    );
  };

  const renderSeoStatistics = () => (
    <div className="mt-6">
      <p className="rounded-[18px] bg-white px-4 py-4 text-[15px] font-medium leading-8 text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.05)] dark:bg-white/[0.04] dark:text-slate-200">
        {seoStatsSummary}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-[18px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <dt className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            {selectedLanguage === "ar" ? "العقارات المنشورة" : "Published homes"}
          </dt>
          <dd className="mt-2 text-[22px] font-extrabold text-slate-950 dark:text-white">
            {formattedCanonicalStatsTotal}
          </dd>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <dt className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            {selectedLanguage === "ar" ? "متاح حاليًا" : "Currently available"}
          </dt>
          <dd className="mt-2 text-[22px] font-extrabold text-slate-950 dark:text-white">
            {formattedCanonicalStatsAvailable}
          </dd>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <dt className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            {selectedLanguage === "ar" ? "أقل سعر معلن" : "Lowest advertised price"}
          </dt>
          <dd className="mt-2 text-[17px] font-extrabold leading-7 text-slate-950 dark:text-white">
            {formattedCanonicalStatsMinPrice ||
              (selectedLanguage === "ar" ? "غير متاح" : "Unavailable")}
          </dd>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <dt className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            {selectedLanguage === "ar" ? "أعلى سعر معلن" : "Highest advertised price"}
          </dt>
          <dd className="mt-2 text-[17px] font-extrabold leading-7 text-slate-950 dark:text-white">
            {formattedCanonicalStatsMaxPrice ||
              (selectedLanguage === "ar" ? "غير متاح" : "Unavailable")}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-[12px] leading-6 text-slate-500 dark:text-slate-400">
        {selectedLanguage === "ar"
          ? `المصدر: بيانات العقارات المنشورة على Navienty${
              formattedCanonicalStatsUpdatedAt
                ? ` — آخر تحديث: ${formattedCanonicalStatsUpdatedAt}`
                : ""
            }. عدد العقارات المحجوزة بالكامل حاليًا: ${formattedCanonicalStatsReserved}.`
          : `Source: Published property data on Navienty${
              formattedCanonicalStatsUpdatedAt
                ? ` — Last updated: ${formattedCanonicalStatsUpdatedAt}`
                : ""
            }. Fully reserved homes currently: ${formattedCanonicalStatsReserved}.`}
      </p>
    </div>
  );

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative min-h-screen bg-white pb-32 text-gray-700 dark:bg-[#050816] dark:text-slate-100 md:pb-0"
    >
      <Script
        id="sakan-collection-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionJsonLd).replace(/</g, "\u003c"),
        }}
      />

      <Script
        id="sakan-breadcrumb-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\u003c"),
        }}
      />

      {faqJsonLd && (
        <Script
          id="sakan-faq-jsonld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd).replace(/</g, "\u003c"),
          }}
        />
      )}

      <input
        id="nav-menu-toggle"
        type="checkbox"
        className="peer sr-only"
        aria-hidden="true"
      />

      <MobileBottomNavScrollController />

      <style>{`
        :root {
          --menu-blue: #054aff;
          --menu-cream: #f2ead8;
          --menu-cream-soft: rgba(242, 234, 216, 0.92);
        }

        .mobile-inline-map {
          display: none;
        }

        .mobile-inline-map__canvas {
          position: relative;
          height: min(52vh, 360px);
          min-height: 292px;
          overflow: hidden;
          border-radius: 0;
          background: #e5edf7;
        }

        .mobile-inline-map__sheet {
          position: relative;
          z-index: 2;
          margin-top: -22px;
          border-radius: 28px 28px 0 0;
          background: #ffffff;
          padding: 9px 18px 18px;
          box-shadow: 0 -10px 24px rgba(15, 23, 42, 0.08);
        }

        .mobile-inline-map__grabber {
          display: block;
          width: 46px;
          height: 4px;
          margin: 0 auto 18px;
          border-radius: 999px;
          background: #d1d5db;
        }

        .mobile-inline-map__fee {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          color: #1f2937;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .mobile-inline-map__fee-icon {
          display: inline-flex;
          height: 24px;
          width: 24px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #fff1f2;
          font-size: 17px;
          line-height: 1;
        }

        @media (max-width: 1023px) {
          .mobile-inline-map {
            display: block;
            margin-left: calc(50% - 50vw);
            margin-right: calc(50% - 50vw);
            margin-top: -32px;
          }
        }

        @media (min-width: 1024px) {
          .mobile-inline-map {
            display: none;
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

        .navienty-logo-mobile {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .navienty-logo-mobile img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          display: block;
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

        .mega-menu-logo {
          position: absolute;
          left: 50%;
          top: -60px;
          transform: translateX(-50%);
          z-index: 2;
        }

        .mega-menu-logo img {
          width: 160px;
          height: auto;
          object-fit: contain;
          display: block;
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

        .mega-menu-footer-links {
          position: absolute;
          right: 56px;
          bottom: 12px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          max-width: 240px;
          text-align: right;
        }

        .mega-menu-footer-link {
          color: rgba(242, 234, 216, 0.88);
          text-decoration: none;
          font-size: 18px;
          line-height: 1.35;
          font-weight: 500;
          letter-spacing: -0.02em;
          transition:
            opacity 0.2s ease,
            transform 0.2s ease,
            color 0.2s ease;
        }

        .mega-menu-footer-link:hover {
          opacity: 1;
          color: var(--menu-cream);
          transform: translateX(-2px);
        }

        .mega-menu-footer-link--email {
          margin-top: 8px;
          opacity: 0.76;
          font-size: 16px;
        }

        .property-card {
          contain: layout paint style;
          content-visibility: auto;
          contain-intrinsic-size: 360px 360px;
          -webkit-tap-highlight-color: transparent;
        }

        .property-media-card {
          isolation: isolate;
          contain: layout paint style;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .property-media-slider {
          position: relative;
          width: 100%;
          height: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          touch-action: pan-x;
          overscroll-behavior-x: contain;
          overscroll-behavior-y: auto;
          contain: layout paint;
        }

        .property-media-slider::-webkit-scrollbar {
          display: none;
        }

        .property-media-slider__track {
          display: flex;
          width: 100%;
          height: 100%;
          contain: layout paint;
        }

        .property-media-slider__slide {
          position: relative;
          flex: 0 0 100%;
          width: 100%;
          height: 100%;
          scroll-snap-align: start;
          scroll-snap-stop: normal;
          user-select: none;
          -webkit-user-drag: none;
          contain: layout paint;
        }

        .property-media-slider__slide img {
          display: block;
          width: 100%;
          height: 100%;
          user-select: none;
          -webkit-user-drag: none;
          pointer-events: none;
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        .property-media-slider__dots {
          pointer-events: auto;
          position: absolute;
          left: 50%;
          bottom: 12px;
          z-index: 40;
          display: none;
          align-items: center;
          gap: 6px;
          transform: translateX(-50%);
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.28);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .property-media-slider__dot {
          width: 6px;
          height: 6px;
          border: 0;
          padding: 0;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.65);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
          cursor: pointer;
          transition:
            width 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        }

        .property-media-slider__dot--active {
          width: 14px;
          background: rgba(255, 255, 255, 0.96);
        }

        .property-media-slider__dot:hover {
          transform: scale(1.12);
        }

        .featured-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 45;
          display: inline-flex;
          max-width: calc(100% - 24px);
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.72);
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.88));
          padding: 7px 12px;
          color: #111827;
          font-size: 12px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.01em;
          box-shadow:
            0 10px 26px rgba(15, 23, 42, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          pointer-events: none;
        }

        [dir='rtl'] .featured-badge {
          left: auto;
          right: 12px;
        }

        .featured-badge__icon {
          display: inline-flex;
          height: 20px;
          width: 20px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 0;
          background: transparent;
          color: inherit;
          line-height: 1;
        }

        .featured-badge__icon-image {
          display: block;
          width: 20px;
          height: 20px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .featured-badge__text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (min-width: 768px) {
          .featured-badge {
            top: 14px;
            left: 14px;
            padding: 8px 14px;
            font-size: 13px;
          }

          [dir='rtl'] .featured-badge {
            left: auto;
            right: 14px;
          }
        }

        .status-ribbon {
          position: absolute;
          top: 0;
          left: 0;
          width: 96px;
          height: 96px;
          overflow: hidden;
          z-index: 30;
          pointer-events: none;
        }

        .status-ribbon__inner {
          position: absolute;
          top: 18px;
          left: -36px;
          width: 142px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-45deg);
          transform-origin: center;
          color: #ffffff;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border-top: 1px solid rgba(255, 255, 255, 0.42);
          border-bottom: 1px solid rgba(0, 0, 0, 0.18);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
          box-shadow:
            0 10px 18px rgba(15, 23, 42, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.34),
            inset 0 -8px 14px rgba(0, 0, 0, 0.16);
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          transition:
            transform 0.35s ease,
            filter 0.35s ease,
            box-shadow 0.35s ease;
        }

        .status-ribbon__inner::before,
        .status-ribbon__inner::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .status-ribbon__inner::before {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.28) 0%,
            rgba(255, 255, 255, 0.08) 35%,
            rgba(0, 0, 0, 0.10) 100%
          );
          mix-blend-mode: soft-light;
        }

        .status-ribbon__inner::after {
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.18) 0%,
            rgba(255, 255, 255, 0.14) 50%,
            rgba(0, 0, 0, 0.14) 100%
          );
          opacity: 0.55;
        }

        .status-ribbon::before,
        .status-ribbon::after {
          content: none !important;
          display: none !important;
        }

        .status-ribbon--available .status-ribbon__inner {
          background-image: linear-gradient(
            135deg,
            #046947 0%,
            #0b8f63 28%,
            #25c28b 58%,
            #0a7a56 100%
          );
        }

        .status-ribbon--reserved .status-ribbon__inner {
          background-image: linear-gradient(
            135deg,
            #8f1239 0%,
            #c81e4b 28%,
            #fb7185 58%,
            #be123c 100%
          );
        }

        .property-meta-gender {
          display: inline-flex;
          min-width: 0;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.25;
          font-weight: 500;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }

        [dir='rtl'] .property-meta-gender {
          flex-direction: row;
        }

        @media (hover: hover) and (pointer: fine) {
          .status-ribbon__inner {
            transition:
              transform 0.35s ease,
              filter 0.35s ease,
              box-shadow 0.35s ease;
          }

          .group:hover .status-ribbon__inner {
            transform: rotate(-45deg) scale(1.03);
            filter: saturate(1.06) brightness(1.02);
            box-shadow:
              0 14px 26px rgba(0, 0, 0, 0.32),
              inset 0 1px 0 rgba(255, 255, 255, 0.26);
          }

          .property-meta-gender {
            transition: color 0.2s ease;
          }

          .group:hover .property-meta-gender {
            color: #334155;
          }
        }

        .mobile-bottom-nav {
          position: fixed;
          left: max(14px, env(safe-area-inset-left, 0px));
          right: max(14px, env(safe-area-inset-right, 0px));
          bottom: calc(env(safe-area-inset-bottom, 0px) + 18px);
          z-index: 120;
          display: none;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.72);
          border-radius: 999px;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.82),
              rgba(255, 255, 255, 0.58)
            );
          box-shadow:
            0 18px 45px rgba(15, 23, 42, 0.18),
            0 6px 18px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.85),
            inset 0 -1px 0 rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(22px) saturate(1.45);
          -webkit-backdrop-filter: blur(22px) saturate(1.45);
          transform: translate3d(0, 0, 0);
          opacity: 1;
          transition:
            transform 0.26s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.2s ease;
          will-change: transform, opacity;
        }

        .mobile-bottom-nav.mobile-bottom-nav--hidden,
        body.mobile-map-sheet--map-expanded .mobile-bottom-nav {
          transform: translate3d(0, calc(100% + 44px), 0);
          opacity: 0;
          pointer-events: none;
        }

        .mobile-bottom-nav::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(
              circle at 18% 0%,
              rgba(255, 255, 255, 0.78),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.34),
              rgba(255, 255, 255, 0.08)
            );
        }

        .mobile-bottom-nav__inner {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          height: 70px;
          padding: 0 14px;
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

          .mega-menu-logo {
            top: 68px;
          }

          .mega-menu-logo img {
            width: 74px;
            height: 74px;
          }

          .mega-menu-body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: auto;
            padding-top: 160px;
            padding-left: 0;
            padding-right: 0;
            padding-bottom: 180px;
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

          .mega-menu-footer-links {
            right: 24px;
            bottom: 12px;
            max-width: 220px;
          }

          .mega-menu-footer-link {
            font-size: 16px;
          }

          .mega-menu-footer-link--email {
            font-size: 15px;
          }

          .status-ribbon {
            width: 96px;
            height: 96px;
            top: 0;
            left: 0;
          }

          .status-ribbon__inner {
            top: 18px;
            left: -36px;
            width: 142px;
            height: 26px;
            font-size: 8px;
            letter-spacing: 0.14em;
          }

          .property-meta-gender {
            font-size: 12px;
          }
        }

        @media (max-width: 768px) {
          .navienty-logo-mobile,
          .menu-trigger {
            display: none !important;
          }

          .mobile-bottom-nav {
            display: block;
          }

          .mega-menu-overlay {
            transform: none;
            transition:
              opacity 0.18s ease,
              visibility 0.18s ease;
          }

          .mega-menu-body {
            padding-bottom: 220px;
          }

          .mega-menu-footer-links {
            left: 24px;
            right: 24px;
            bottom: 76px;
            align-items: flex-start;
            text-align: left;
            max-width: none;
            gap: 8px;
          }

          [dir='rtl'] .mega-menu-footer-links {
            align-items: flex-end;
            text-align: right;
          }

          .mega-menu-footer-link {
            font-size: 16px;
          }

          .mega-menu-footer-link--email {
            margin-top: 6px;
            font-size: 14px;
          }

          .footer-esaf {
            display: none;
          }

          .property-card {
            contain-intrinsic-size: 330px 340px;
          }

          .property-media-card {
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.07);
          }

          .property-media-gradient {
            height: 48px;
            opacity: 0.75;
          }

          .property-media-slider {
            scroll-snap-type: x proximity;
          }

          .property-media-slider__dots {
            display: flex;
            bottom: 8px;
            gap: 5px;
            padding: 4px 7px;
            background: rgba(15, 23, 42, 0.22);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }

          .property-media-slider__dot {
            width: 5px;
            height: 5px;
            transition: none;
          }

          .property-media-slider__dot--active {
            width: 12px;
          }

          .status-ribbon {
            width: 92px;
            height: 92px;
            top: 0;
            left: 0;
          }

          .status-ribbon__inner {
            top: 17px;
            left: -36px;
            width: 138px;
            height: 25px;
            font-size: 7px;
            letter-spacing: 0.12em;
            box-shadow:
              0 7px 14px rgba(15, 23, 42, 0.20),
              inset 0 1px 0 rgba(255, 255, 255, 0.30),
              inset 0 -7px 12px rgba(0, 0, 0, 0.14);
          }

          .mobile-bottom-nav__item,
          .mobile-bottom-nav__icon--image {
            transition: none;
          }
        }


        @media (prefers-color-scheme: dark) {
          .mobile-inline-map__sheet {
            background: #050816;
            box-shadow: 0 -10px 24px rgba(0, 0, 0, 0.28);
          }

          .mobile-inline-map__grabber {
            background: rgba(148, 163, 184, 0.45);
          }

          .mobile-inline-map__fee {
            color: #f8fafc;
          }

          .menu-trigger-lines span {
            background: #f8fafc;
          }

          .property-media-card {
            background-color: #111827;
          }

          .property-media-gradient {
            opacity: 0.88;
          }

          .property-media-slider__dots {
            background: rgba(2, 6, 23, 0.42);
          }

          .property-media-slider__dot {
            background: rgba(255, 255, 255, 0.56);
          }

          .property-media-slider__dot--active {
            background: rgba(255, 255, 255, 0.96);
          }

          .property-meta-gender {
            color: #94a3b8;
          }

          .group:hover .property-meta-gender {
            color: #cbd5e1;
          }

          .mobile-bottom-nav {
            border-color: rgba(255, 255, 255, 0.16);
            background:
              linear-gradient(
                135deg,
                rgba(15, 23, 42, 0.78),
                rgba(15, 23, 42, 0.52)
              );
            box-shadow:
              0 18px 45px rgba(0, 0, 0, 0.36),
              0 6px 18px rgba(0, 0, 0, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.14),
              inset 0 -1px 0 rgba(255, 255, 255, 0.08);
          }

          .mobile-bottom-nav__item {
            color: #94a3b8;
          }

          .mobile-bottom-nav__item:hover {
            color: #f8fafc;
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

          .mobile-bottom-nav__item:hover .mobile-bottom-nav__icon--image,
          .mobile-bottom-nav__item--active .mobile-bottom-nav__icon--image {
            filter: brightness(0) invert(1);
            opacity: 1;
          }

          .footer-esaf {
            background: #054aff;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <PropertiesHeader
        homeHref={buildPropertiesPageLink()}
        searchBarProps={searchBarProps}
        t={{
          startSearch: t.startSearch,
          sortBy: t.sortBy,
          backToProperties: t.backToProperties,
        }}
        showMobileSearchHeaderExtras
        mobileBackHref={buildPropertiesPageLink()}
        mobileSortProps={{
          isArabic,
          selectedSort,
          sortByLabel: t.sortBy,
          amenitiesLabel: t.amenities,
          options: sortOptions,
          amenities: (amenities as Amenity[]) ?? [],
        }}
      />

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

            <div className="mega-menu-logo">
              <Link href={buildPropertiesPageLink()} aria-label="Navienty home">
                <img
                  src="https://i.ibb.co/5gYVYQSR/Navienty-1.jpg"
                  alt="Navienty"
                />
              </Link>
            </div>
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

            <div className="mega-menu-footer-links">
              {menuFooterLinks.map((item) =>
                item.isEmail ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="mega-menu-footer-link mega-menu-footer-link--email"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="mega-menu-footer-link"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10 lg:px-8">
        <div className="mb-8 hidden flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:flex">
          <SortDropdown
            isArabic={isArabic}
            selectedSort={selectedSort}
            showSeasonFilter
            sortByLabel={t.sortBy}
            seasonLabel={t.season}
            summerCourseLabel={t.summerCourse}
            academicYearLabel={t.academicYear}
            amenitiesLabel={t.amenities}
            options={sortOptions}
            amenities={(amenities as Amenity[]) ?? []}
            selectedCurrency={selectedCurrency}
            currencyRate={currencyRate}
          />
        </div>

        <div className="hidden lg:block">
          <PropertyAlertRequestCard
            action={createPropertyAlertRequest}
            cities={(cities as City[]) ?? []}
            universities={(universities as University[]) ?? []}
            areas={(areas as PropertyArea[]) ?? []}
            universityAreas={(universityAreas as UniversityArea[]) ?? []}
            initialCityId={params.city_id ?? ""}
            initialUniversityId={params.university_id ?? ""}
            initialAreaId={params.area_id ?? ""}
            language={selectedLanguage}
            currency={selectedCurrency}
            currentPath={buildAlertReturnTo()}
            resultCount={count}
            alertStatus={alertStatus}
          />
        </div>

        {sortedProperties.length > 0 ? (
          <>
            <MobileSearchMapSheet
              properties={mapProperties}
              feeLabel={
                isArabic ? "الأسعار تشمل كل الرسوم" : "Prices include all fees"
              }
              homesLabel={mobileMapHomesLabel}
            >
              <div dir={isArabic ? "rtl" : "ltr"}>
                <div className="grid grid-cols-1 gap-6">
                  {sortedProperties.map((property) =>
                    renderPropertyCard(property),
                  )}
                </div>

                {renderPagination()}

                <section
                  className="mt-8 px-1 pb-[calc(env(safe-area-inset-bottom,0px)+128px)] lg:hidden"
                  dir="rtl"
                  aria-labelledby="sakan-mobile-seo-heading"
                >
                  <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-[#0b1220]">
                    <h1
                      id="sakan-mobile-seo-heading"
                      className="text-[22px] font-extrabold leading-tight tracking-[-0.03em] text-slate-950 dark:text-white"
                    >
                      {seoH1}
                    </h1>

                    <p className="mt-4 text-[15px] leading-8 text-slate-600 dark:text-slate-300">
                      {seoIntro}
                    </p>

                    {renderSeoStatistics()}

                    {seoFaqItems.length > 0 && (
                      <div className="mt-8">
                        <h2 className="mb-4 text-xl font-extrabold text-slate-950 dark:text-white">
                          أسئلة شائعة
                        </h2>

                        <div className="space-y-3">
                          {seoFaqItems
                            .slice(0, 6)
                            .map((item: any, index: number) => (
                              <details
                                key={`${item.q}-${index}`}
                                className="group rounded-[20px] border border-slate-200 bg-white px-4 py-1 dark:border-white/10 dark:bg-white/[0.04]"
                              >
                                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[16px] font-bold text-slate-900 marker:hidden dark:text-slate-100">
                                  <span>{item.q}</span>

                                  <span
                                    aria-hidden="true"
                                    className="text-xl font-medium text-[#054aff] transition-transform group-open:rotate-45"
                                  >
                                    +
                                  </span>
                                </summary>

                                <p className="border-t border-slate-100 pb-4 pt-3 text-[15px] leading-8 text-slate-600 dark:border-white/10 dark:text-slate-300">
                                  {item.a}
                                </p>
                              </details>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </MobileSearchMapSheet>

            <div
              className="hidden grid-cols-1 gap-8 lg:grid lg:grid-cols-[minmax(0,52%)_minmax(420px,48%)]"
              dir="ltr"
            >
              <div dir={isArabic ? "rtl" : "ltr"}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {sortedProperties.map((property) =>
                    renderPropertyCard(property),
                  )}
                </div>

                {renderPagination()}
              </div>

              <aside className="sticky top-28 hidden h-[calc(100vh-8rem)] overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1220] lg:block">
                <PropertiesMap properties={mapProperties} />
              </aside>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-white/10 dark:bg-[#0b1220]">
            <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">
              {t.noResults}
            </p>
          </div>
        )}
      </section>

      <section
        className="mx-auto hidden max-w-5xl px-4 pb-12 lg:block lg:px-8"
        dir="rtl"
        aria-labelledby="sakan-desktop-seo-heading"
      >
        <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-[#0b1220] md:rounded-[32px] md:p-8">
          <h1
            id="sakan-desktop-seo-heading"
            className="text-[22px] font-extrabold leading-tight tracking-[-0.03em] text-slate-950 dark:text-white md:text-2xl"
          >
            {seoH1}
          </h1>

          <p className="mt-4 text-[15px] leading-8 text-slate-600 dark:text-slate-300 md:text-base">
            {seoIntro}
          </p>

          {renderSeoStatistics()}

          {seoFaqItems.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-extrabold text-slate-950 dark:text-white">
                أسئلة شائعة
              </h2>

              <div className="space-y-3">
                {seoFaqItems.slice(0, 6).map((item: any, index: number) => (
                  <details
                    key={`${item.q}-${index}`}
                    className="group rounded-[20px] border border-slate-200 bg-white px-4 py-1 dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[16px] font-bold text-slate-900 marker:hidden dark:text-slate-100">
                      <span>{item.q}</span>

                      <span
                        aria-hidden="true"
                        className="text-xl font-medium text-[#054aff] transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>

                    <p className="border-t border-slate-100 pb-4 pt-3 text-[15px] leading-8 text-slate-600 dark:border-white/10 dark:text-slate-300">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="footer-esaf">
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
            <p className="footer-esaf-copyright">{t.copyright}</p>
          </div>
        </div>
      </footer>

      <nav
        id="mobile-bottom-nav"
        className="mobile-bottom-nav"
        aria-label="Mobile bottom navigation"
      >
        <div className="mobile-bottom-nav__inner">
          <Link
            href={buildPropertiesPageLink()}
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
              <circle cx="11" cy="11" r="6.5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 16l4 4"
              />
            </svg>
            <span className="mobile-bottom-nav__label">{t.explore}</span>
          </Link>

          <Link
            href={buildSimpleNavLink("/community")}
            className="mobile-bottom-nav__item"
          >
            <img
              src="https://i.ibb.co/fzNcyyxw/community-3010762.png"
              alt={t.community}
              className="mobile-bottom-nav__icon mobile-bottom-nav__icon--image"
            />
            <span className="mobile-bottom-nav__label">{t.community}</span>
          </Link>

          <Link
            href={mobileLanguageHref}
            className="mobile-bottom-nav__item"
            aria-label={mobileLanguageAriaLabel}
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
                d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 9h16.5M3.75 15h16.5M12 3c2.25 2.45 3.35 5.35 3.35 9S14.25 18.55 12 21M12 3C9.75 5.45 8.65 8.35 8.65 12S9.75 18.55 12 21"
              />
            </svg>
            <span className="mobile-bottom-nav__label">
              {mobileLanguageLabel}
            </span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
