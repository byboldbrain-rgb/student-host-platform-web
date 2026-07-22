"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PropertiesSearchBar from "./PropertiesSearchBar";
import SortDropdown from "./search/SortDropdown";

type City = {
  id: string | number;
  name_en: string;
  name_ar?: string;
};

type University = {
  id: string | number;
  name_en: string;
  name_ar?: string;
  city_id: string | number;
};

type PropertyArea = {
  id: string | number;
  city_id: string | number;
  name_en: string;
  name_ar?: string;
  is_active?: boolean | null;
};

type UniversityArea = {
  id?: string | number;
  university_id: string | number;
  area_id: string | number;
};

type SupportedLanguage = "en" | "ar";
type LocationMode = "city-university-area" | "city-area";

type Labels = {
  city: string;
  university: string;
  area: string;
  duration: string;

  searchCities: string;
  searchAreas: string;

  chooseUniversity: string;
  chooseArea: string;
  chooseDuration: string;

  selectCity: string;
  selectUniversity: string;
  selectArea: string;
  selectDuration: string;

  anyCity: string;
  anyUniversity: string;
  anyArea: string;
  anyDuration: string;

  daily: string;
  monthly: string;

  search?: string;
  clearAll?: string;
};

type SupportedSort =
  | "newly_listed"
  | "lowest_price"
  | "highest_price"
  | "boys"
  | "girls";

type SortOption = {
  value: SupportedSort;
  label: string;
  href: string;
};

type AmenityOption = {
  id: string;
  name_en: string;
  name_ar: string;
  icon_url?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

type SearchBarProps = {
  cities?: City[];
  universities?: University[];
  areas?: PropertyArea[];
  universityAreas?: UniversityArea[];

  initialCityId?: string;
  initialUniversityId?: string;
  initialAreaId?: string;
  initialRentalDuration?: string;
  initialPriceRange?: string;

  language?: SupportedLanguage;
  currency?: string;
  labels?: Partial<Labels>;
  locationMode?: LocationMode;
};

type HeaderTexts = {
  startSearch: string;
  sortBy?: string;
  backToProperties?: string;
};

type MobileSortProps = {
  isArabic: boolean;
  selectedSort: SupportedSort;
  sortByLabel: string;
  amenitiesLabel?: string;
  options: SortOption[];
  amenities?: AmenityOption[];
};

type Props = {
  homeHref: string;
  searchBarProps?: SearchBarProps;
  t: HeaderTexts;
  showMobileSearchHeaderExtras?: boolean;
  mobileBackHref?: string;
  mobileSortProps?: MobileSortProps;
  hideDesktopHeader?: boolean;

  /**
   * Set this to true when the large desktop search bar is rendered inside
   * the page hero. In that mode, the header only shows the compact search
   * bar after the user scrolls.
   */
  desktopSearchInHero?: boolean;
};

export default function PropertiesHeader({
  homeHref,
  searchBarProps,
  t,
  showMobileSearchHeaderExtras = false,
  mobileBackHref = "",
  mobileSortProps,
  hideDesktopHeader = false,
  desktopSearchInHero = false,
}: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [forceExpanded, setForceExpanded] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const hasSearchBar = Boolean(searchBarProps);

  const normalizedSearchBarProps = useMemo(() => {
    if (!searchBarProps) return null;

    const isArabic = searchBarProps.language === "ar";
    const incomingLabels = searchBarProps.labels ?? {};

    return {
      ...searchBarProps,
      cities: searchBarProps.cities ?? [],
      universities: searchBarProps.universities ?? [],
      areas: searchBarProps.areas ?? [],
      universityAreas: searchBarProps.universityAreas ?? [],
      labels: {
        city: incomingLabels.city ?? (isArabic ? "المدينة" : "City"),
        university:
          incomingLabels.university ?? (isArabic ? "الجامعة" : "University"),
        area: incomingLabels.area ?? (isArabic ? "المنطقة" : "Area"),
        duration: incomingLabels.duration ?? (isArabic ? "المدة" : "Duration"),
        searchCities:
          incomingLabels.searchCities ??
          (isArabic ? "ابحث عن مدينة" : "Search cities"),
        searchAreas:
          incomingLabels.searchAreas ??
          (isArabic ? "ابحث عن منطقة" : "Search areas"),
        chooseUniversity:
          incomingLabels.chooseUniversity ??
          (isArabic ? "اختر الجامعة" : "Choose university"),
        chooseArea:
          incomingLabels.chooseArea ??
          (isArabic ? "اختر المنطقة" : "Choose area"),
        chooseDuration:
          incomingLabels.chooseDuration ??
          (isArabic ? "اختر المدة" : "Choose duration"),
        selectCity:
          incomingLabels.selectCity ??
          (isArabic ? "اختر المدينة" : "Select city"),
        selectUniversity:
          incomingLabels.selectUniversity ??
          (isArabic ? "اختر الجامعة" : "Select university"),
        selectArea:
          incomingLabels.selectArea ??
          (isArabic ? "اختر المنطقة" : "Select area"),
        selectDuration:
          incomingLabels.selectDuration ??
          (isArabic ? "اختر المدة" : "Select duration"),
        anyCity: incomingLabels.anyCity ?? (isArabic ? "أي مدينة" : "Any city"),
        anyUniversity:
          incomingLabels.anyUniversity ??
          (isArabic ? "أي جامعة" : "Any university"),
        anyArea: incomingLabels.anyArea ?? (isArabic ? "أي منطقة" : "Any area"),
        anyDuration:
          incomingLabels.anyDuration ?? (isArabic ? "أي مدة" : "Any duration"),
        daily: incomingLabels.daily ?? (isArabic ? "يومي" : "Daily"),
        monthly: incomingLabels.monthly ?? (isArabic ? "شهري" : "Monthly"),
        search: incomingLabels.search ?? (isArabic ? "بحث" : "Search"),
        clearAll:
          incomingLabels.clearAll ?? (isArabic ? "مسح الكل" : "Clear all"),
      },
    };
  }, [searchBarProps]);

  useEffect(() => {
    let ticking = false;

    const updateScrollState = () => {
      const y = window.scrollY;

      if (!forceExpanded) {
        setIsScrolled((previousValue) => {
          if (!previousValue && y > 140) return true;
          if (previousValue && y < 90) return false;
          return previousValue;
        });
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;

      window.requestAnimationFrame(updateScrollState);
      ticking = true;
    };

    updateScrollState();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [forceExpanded]);

  useEffect(() => {
    if (!isMobileSearchOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSearchOpen]);

  useEffect(() => {
    if (!hasSearchBar && isMobileSearchOpen) {
      setIsMobileSearchOpen(false);
    }
  }, [hasSearchBar, isMobileSearchOpen]);

  const showCompact = isScrolled && !forceExpanded;
  const showDesktopSearch =
    hasSearchBar &&
    Boolean(normalizedSearchBarProps) &&
    (!desktopSearchInHero || isScrolled || forceExpanded);

  const desktopHeaderHeight = !hasSearchBar
    ? "h-[82px]"
    : desktopSearchInHero && !isScrolled && !forceExpanded
      ? "h-[82px]"
      : showCompact
        ? "h-[94px]"
        : "h-[168px]";

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          body.desktop-gallery-open .properties-header {
            display: none !important;
          }
        }

        @media (prefers-color-scheme: dark) {
          .properties-header {
            background: #0b1220 !important;
            border-bottom-color: rgba(255, 255, 255, 0.1) !important;
          }

          .properties-header .navienty-logo,
          .properties-header .navienty-logo-mobile {
            color: #f8fafc;
          }

          .properties-mobile-search-overlay {
            background: #050816 !important;
          }

          .properties-mobile-search-close {
            background: #0b1220 !important;
            border-color: rgba(255, 255, 255, 0.12) !important;
            color: #f8fafc !important;
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.32) !important;
          }
        }
      `}</style>

      <header
        className={`properties-header sticky top-0 z-[130] border-b border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)] md:bg-[#f7f7f7] md:shadow-none md:dark:bg-[#0b1220] ${
          hideDesktopHeader ? "md:hidden" : ""
        }`}
      >
        <div className="w-full bg-white pb-2 pt-1 dark:bg-[#0b1220] md:hidden">
          <div className="flex items-center justify-center px-3 pb-1 pt-3">
            <Link
              href={homeHref}
              className="inline-flex items-center justify-center"
              aria-label="Navienty home"
            >
              <img
                src="https://i.ibb.co/FLsWDBr6/Untitled.png"
                alt="Navienty"
                className="h-[52px] w-[52px] object-contain"
              />
            </Link>
          </div>

          {hasSearchBar && normalizedSearchBarProps && (
            <div className="px-3 pb-4 pt-2">
              {showMobileSearchHeaderExtras &&
              mobileSortProps &&
              mobileBackHref ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={mobileBackHref}
                    aria-label={t.backToProperties || "Back"}
                    className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border border-[#dedede] bg-white text-[#222] shadow-[0_1px_5px_rgba(0,0,0,0.08)] transition dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-100 dark:shadow-[0_8px_22px_rgba(0,0,0,0.28)] dark:hover:bg-[#111827]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.9}
                      stroke="currentColor"
                      className="h-[15px] w-[15px]"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={
                          mobileSortProps.isArabic
                            ? "m10 6 6 6-6 6"
                            : "m14 6-6 6 6 6"
                        }
                      />
                    </svg>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="flex h-[44px] min-w-0 flex-1 items-center gap-2 rounded-full border border-[#dedede] bg-white px-4 shadow-[0_1px_5px_rgba(0,0,0,0.08)] transition dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_8px_22px_rgba(0,0,0,0.28)] dark:hover:bg-[#111827]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.2}
                      stroke="currentColor"
                      className="h-[16px] w-[16px] shrink-0 text-[#222] dark:text-slate-100"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                      />
                    </svg>

                    <span className="truncate text-[13px] font-semibold leading-none text-[#222] dark:text-slate-100">
                      {t.startSearch}
                    </span>
                  </button>

                  <div className="mobile-sort-icon-only shrink-0">
                    <SortDropdown
                      isArabic={mobileSortProps.isArabic}
                      selectedSort={mobileSortProps.selectedSort}
                      sortByLabel={mobileSortProps.sortByLabel}
                      amenitiesLabel={mobileSortProps.amenitiesLabel}
                      options={mobileSortProps.options}
                      amenities={mobileSortProps.amenities ?? []}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="mx-auto flex h-[44px] w-full items-center justify-center gap-2 rounded-full border border-[#dedede] bg-white px-4 shadow-[0_1px_5px_rgba(0,0,0,0.08)] transition dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_8px_22px_rgba(0,0,0,0.28)] dark:hover:bg-[#111827]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.2}
                    stroke="currentColor"
                    className="h-[16px] w-[16px] text-[#222] dark:text-slate-100"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                    />
                  </svg>

                  <span className="truncate text-[13px] font-semibold leading-none text-[#222] dark:text-slate-100">
                    {t.startSearch}
                  </span>
                </button>
              )}
            </div>
          )}

          {isMobileSearchOpen && normalizedSearchBarProps && (
            <div className="properties-mobile-search-overlay fixed inset-0 z-[220] overflow-y-auto bg-[#f2f2f2] dark:bg-[#050816]">
              <div className="flex items-center justify-end px-4 pb-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  aria-label="Close search"
                  className="properties-mobile-search-close flex h-11 w-11 items-center justify-center rounded-full border border-[#d8d8d8] bg-[#f7f7f7] text-[#222222] shadow-sm transition dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-100 dark:hover:bg-[#111827]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 6l12 12M18 6L6 18"
                    />
                  </svg>
                </button>
              </div>

              <div className="px-3 pb-6">
                <PropertiesSearchBar
                  {...normalizedSearchBarProps}
                  mobileSearchBarClassName={
                    showMobileSearchHeaderExtras ? "mt-0" : ""
                  }
                  mobileMode
                  mobileOpen
                  onRequestClose={() => setIsMobileSearchOpen(false)}
                />
              </div>
            </div>
          )}
        </div>

        {!hideDesktopHeader && (
          <div className="hidden md:block">
            <div className="mx-auto max-w-[1920px] px-6">
              <div
                className={`relative transition-[height] duration-300 ${desktopHeaderHeight}`}
              >
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <Link
                    href={homeHref}
                    className="pointer-events-auto inline-flex items-center justify-center"
                    aria-label="Navienty home"
                  >
                    <img
                      src="https://i.ibb.co/FLsWDBr6/Untitled.png"
                      alt="Navienty"
                      className="h-[58px] w-[58px] object-contain"
                    />
                  </Link>
                </div>

                {showDesktopSearch && normalizedSearchBarProps && (
                  <div
                    className={`absolute left-1/2 z-30 flex -translate-x-1/2 origin-center justify-center transition-[top,transform,width,max-width] duration-300 ${
                      showCompact
                        ? "top-1/2 w-max max-w-[calc(100vw-190px)] -translate-y-1/2 scale-[0.92]"
                        : "top-[72px] w-full max-w-[1000px] scale-[0.92]"
                    }`}
                  >
                    <PropertiesSearchBar
                      {...normalizedSearchBarProps}
                      compact={showCompact}
                      onOpenMenuChange={(isOpen) => {
                        setForceExpanded(isOpen);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
