"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SupportedSort =
  "newly_listed" | "lowest_price" | "highest_price" | "boys" | "girls";

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

type SortDropdownProps = {
  isArabic: boolean;
  selectedSort: SupportedSort;
  sortByLabel: string;
  genderLabel?: string;
  seasonLabel?: string;
  summerCourseLabel?: string;
  academicYearLabel?: string;
  showSeasonFilter?: boolean;
  amenitiesLabel?: string;
  priceRangeLabel?: string;
  minimumPriceLabel?: string;
  maximumPriceLabel?: string;
  floorLabel?: string;
  floorPlaceholder?: string;
  floorHelperLabel?: string;
  showResultsLabel?: string;
  clearAllLabel?: string;
  closeLabel?: string;
  options: SortOption[];
  amenities?: AmenityOption[];
  selectedCurrency?: string;
  currencyRate?: number;
};

type GenderValue = "boys" | "girls";
type SortValue = "newly_listed" | "lowest_price" | "highest_price";
type PricingSeasonCode = "summer_course" | "academic_year";

function FilterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-[22px] w-[22px] md:h-6 md:w-6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildSectionedOptions(options: SortOption[]) {
  const genderOrder: GenderValue[] = ["girls", "boys"];
  const sortOrder: SortValue[] = [
    "newly_listed",
    "highest_price",
    "lowest_price",
  ];
  const byValue = new Map(options.map((option) => [option.value, option]));

  return {
    gender: genderOrder
      .map((value) => byValue.get(value))
      .filter(Boolean) as SortOption[],
    sortBy: sortOrder
      .map((value) => byValue.get(value))
      .filter(Boolean) as SortOption[],
  };
}

function normalizeSelectedAmenityIds(value: string | null) {
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

function normalizeGenderParam(value: string | null): GenderValue | null {
  if (value === "boys" || value === "girls") return value;
  return null;
}

function normalizeSortParam(value: string | null): SortValue | null {
  if (
    value === "newly_listed" ||
    value === "highest_price" ||
    value === "lowest_price"
  ) {
    return value;
  }

  return null;
}

function normalizeSeasonParam(value: string | null): PricingSeasonCode | null {
  if (value === "summer_course" || value === "academic_year") return value;
  return null;
}

function normalizeNonNegativeNumber(value: string | null) {
  if (value === null || value.trim() === "") return null;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) return null;

  return numberValue;
}

function normalizeFloorParam(value: string | null) {
  const numberValue = normalizeNonNegativeNumber(value);

  if (numberValue === null || !Number.isInteger(numberValue)) return null;

  return numberValue;
}

function getSafeCurrencyRate(rate: number | undefined) {
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0
    ? rate
    : 1;
}

function serializeNumber(value: number) {
  const roundedValue = Math.round(value * 100) / 100;
  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : roundedValue.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function convertEgpToDisplayValue(
  valueEgp: number | null,
  currencyRate: number,
) {
  if (valueEgp === null) return "";
  return serializeNumber(valueEgp * currencyRate);
}

function convertDisplayValueToEgp(value: number, currencyRate: number) {
  return value / currencyRate;
}

function GenderImage({
  value,
  label,
}: {
  value: SupportedSort;
  label: string;
}) {
  const iconSrc =
    value === "boys"
      ? "https://i.ibb.co/3mXtzm39/Untitled-19.png"
      : "https://i.ibb.co/zWbxD8GR/Untitled-14.png";

  return (
    <img
      src={iconSrc}
      alt={label}
      className="h-full w-full object-cover"
      loading="lazy"
      draggable={false}
    />
  );
}

function GenderCard({
  option,
  isActive,
  onSelect,
}: {
  option: SortOption;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={option.label}
      aria-pressed={isActive}
      className="block min-w-0 overflow-hidden rounded-[24px] outline-none transition duration-300"
    >
      <div
        className={`aspect-[1.45/1] overflow-hidden rounded-[24px] border bg-white transition duration-300 dark:bg-[#0b1220] ${
          isActive
            ? "border-[#0A46FF] shadow-[0_16px_38px_rgba(10,70,255,0.16)] ring-4 ring-[#0A46FF]/10 dark:border-[#60a5fa] dark:shadow-[0_18px_42px_rgba(96,165,250,0.14)] dark:ring-[#60a5fa]/10"
            : "border-[#e5e7eb] shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:border-[#cbd5e1] hover:shadow-[0_16px_38px_rgba(15,23,42,0.12)] dark:border-white/10 dark:shadow-[0_12px_30px_rgba(0,0,0,0.28)] dark:hover:border-white/20"
        }`}
      >
        <GenderImage value={option.value} label={option.label} />
      </div>
    </button>
  );
}

function SeasonCard({
  value,
  label,
  isActive,
  onSelect,
}: {
  value: PricingSeasonCode;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      data-season={value}
      onClick={onSelect}
      aria-label={label}
      aria-pressed={isActive}
      className={`group flex min-h-[112px] min-w-0 flex-col items-center justify-center rounded-[22px] border px-3 py-4 text-center outline-none transition duration-300 ${
        isActive
          ? "border-[#0A46FF] bg-[#f7f9ff] text-[#0A46FF] shadow-[0_14px_34px_rgba(10,70,255,0.14)] ring-4 ring-[#0A46FF]/10 dark:border-[#60a5fa] dark:bg-[#0f1b35] dark:text-[#93c5fd] dark:ring-[#60a5fa]/10"
          : "border-[#dddddd] bg-white text-[#334155] hover:border-[#b9c5d4] hover:bg-[#fafbff] dark:border-white/10 dark:bg-[#111827] dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-[#172033]"
      }`}
    >
      <span className="text-[14px] font-semibold leading-snug sm:text-[15px]">
        {label}
      </span>
    </button>
  );
}

function AmenityCard({
  amenity,
  label,
  isActive,
  onToggle,
}: {
  amenity: AmenityOption;
  label: string;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={isActive}
      className="block min-w-0 rounded-[18px] outline-none"
      title={label}
    >
      <div
        className={`flex h-[106px] items-center justify-center overflow-hidden rounded-[16px] border bg-white p-1 transition duration-300 dark:bg-[#0b1220] sm:h-[112px] sm:p-1 ${
          isActive
            ? "border-[#0A46FF] shadow-[0_10px_24px_rgba(10,70,255,0.14)] ring-4 ring-[#0A46FF]/10 dark:border-[#60a5fa] dark:shadow-[0_14px_30px_rgba(96,165,250,0.14)] dark:ring-[#60a5fa]/10"
            : "border-[#dddddd] shadow-none hover:border-[#bdbdbd] dark:border-white/10 dark:hover:border-white/20"
        }`}
      >
        {amenity.icon_url ? (
          <img
            src={amenity.icon_url}
            alt={label}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[12px] bg-[#f8fafc] px-3 text-center text-[11px] font-semibold text-[#64748b] dark:bg-[#111827] dark:text-slate-300">
            {label}
          </div>
        )}
      </div>

      <div className="mt-3 text-center text-[14px] font-medium leading-snug tracking-[-0.01em] text-[#222222] dark:text-slate-100 sm:text-[15px]">
        {label}
      </div>
    </button>
  );
}


const PRICE_HISTOGRAM_BARS = [
  2, 3, 4, 5, 7, 10, 13, 18, 15, 22, 18, 27, 24, 31, 29, 37, 44, 52,
  47, 66, 55, 73, 61, 79, 67, 58, 72, 64, 55, 50, 61, 48, 43, 38, 47, 51,
  33, 42, 30, 38, 31, 25, 29, 22, 18, 21, 15, 12,
] as const;

function clampNumber(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function PriceRangeFilter({
  isArabic,
  minimumLabel,
  maximumLabel,
  minimumValue,
  maximumValue,
  onMinimumChange,
  onMaximumChange,
  currencyRate,
}: {
  isArabic: boolean;
  minimumLabel: string;
  maximumLabel: string;
  minimumValue: string;
  maximumValue: string;
  onMinimumChange: (value: string) => void;
  onMaximumChange: (value: string) => void;
  currencyRate: number;
}) {
  const safeRate = getSafeCurrencyRate(currencyRate);
  const defaultMaximum = Math.max(1, Math.round(17000 * safeRate));
  const rawMinimum = normalizeNonNegativeNumber(minimumValue);
  const rawMaximum = normalizeNonNegativeNumber(maximumValue);

  const requestedMaximum = Math.max(
    defaultMaximum,
    rawMinimum ?? 0,
    rawMaximum ?? 0,
  );
  const scaleUnit = Math.max(1, Math.round(1000 * safeRate));
  const sliderMaximum = Math.max(
    scaleUnit,
    Math.ceil(requestedMaximum / scaleUnit) * scaleUnit,
  );
  const sliderStep = Math.max(0.01, Math.round(100 * safeRate * 100) / 100);

  const minimumSliderValue = clampNumber(
    rawMinimum ?? 0,
    0,
    sliderMaximum,
  );
  const maximumSliderValue = clampNumber(
    rawMaximum ?? sliderMaximum,
    minimumSliderValue,
    sliderMaximum,
  );

  const minimumPercent = (minimumSliderValue / sliderMaximum) * 100;
  const maximumPercent = (maximumSliderValue / sliderMaximum) * 100;
  const maximumPlaceholder = `${serializeNumber(sliderMaximum)}+`;

  const handleMinimumSliderChange = (nextValue: string) => {
    const parsedValue = Number(nextValue);
    const clampedValue = clampNumber(
      parsedValue,
      0,
      maximumSliderValue,
    );

    onMinimumChange(clampedValue <= 0 ? "" : serializeNumber(clampedValue));
  };

  const handleMaximumSliderChange = (nextValue: string) => {
    const parsedValue = Number(nextValue);
    const clampedValue = clampNumber(
      parsedValue,
      minimumSliderValue,
      sliderMaximum,
    );

    onMaximumChange(
      clampedValue >= sliderMaximum ? "" : serializeNumber(clampedValue),
    );
  };

  const handleMinimumInputChange = (nextValue: string) => {
    const parsedValue = normalizeNonNegativeNumber(nextValue);

    if (parsedValue === null) {
      onMinimumChange(nextValue);
      return;
    }

    if (rawMaximum !== null && parsedValue > rawMaximum) {
      onMinimumChange(serializeNumber(rawMaximum));
      return;
    }

    onMinimumChange(nextValue);
  };

  const handleMaximumInputChange = (nextValue: string) => {
    const parsedValue = normalizeNonNegativeNumber(nextValue);

    if (parsedValue === null) {
      onMaximumChange(nextValue);
      return;
    }

    if (rawMinimum !== null && parsedValue < rawMinimum) {
      onMaximumChange(serializeNumber(rawMinimum));
      return;
    }

    onMaximumChange(nextValue);
  };

  return (
    <div className="price-range-filter" dir={isArabic ? "rtl" : "ltr"}>
     

      <div className="mt-7 px-1 sm:mt-8 sm:px-0" dir="ltr">
        <div className="relative h-[112px] sm:h-[122px]">
          <div className="absolute inset-x-3 bottom-[30px] flex h-[82px] items-end gap-[3px] overflow-hidden sm:inset-x-5 sm:gap-[4px]">
            {PRICE_HISTOGRAM_BARS.map((height, index) => {
              const barPercent =
                PRICE_HISTOGRAM_BARS.length <= 1
                  ? 0
                  : (index / (PRICE_HISTOGRAM_BARS.length - 1)) * 100;
              const isSelected =
                barPercent >= minimumPercent && barPercent <= maximumPercent;

              return (
                <span
                  key={`${height}-${index}`}
                  className={`min-w-0 flex-1 rounded-t-[3px] transition-colors duration-200 ${
                    isSelected
                      ? "bg-[#0A46FF]"
                      : "bg-[#d8d8d8] dark:bg-slate-600"
                  }`}
                  style={{ height: `${height}%` }}
                  aria-hidden="true"
                />
              );
            })}
          </div>

          <div
            className="absolute inset-x-3 bottom-[29px] h-[2px] rounded-full sm:inset-x-5"
            style={{
              background: `linear-gradient(to right, #dddddd 0%, #dddddd ${minimumPercent}%, #0A46FF ${minimumPercent}%, #0A46FF ${maximumPercent}%, #dddddd ${maximumPercent}%, #dddddd 100%)`,
            }}
            aria-hidden="true"
          />

          <div className="absolute inset-x-3 bottom-[9px] h-10 sm:inset-x-5">
            <input
              type="range"
              min="0"
              max={sliderMaximum}
              step={sliderStep}
              value={minimumSliderValue}
              onChange={(event) =>
                handleMinimumSliderChange(event.target.value)
              }
              aria-label={minimumLabel}
              className="price-range-filter__slider price-range-filter__slider--minimum"
            />

            <input
              type="range"
              min="0"
              max={sliderMaximum}
              step={sliderStep}
              value={maximumSliderValue}
              onChange={(event) =>
                handleMaximumSliderChange(event.target.value)
              }
              aria-label={maximumLabel}
              className="price-range-filter__slider price-range-filter__slider--maximum"
            />
          </div>
        </div>

        <div className="mt-1 grid grid-cols-2 gap-6 sm:gap-10" dir="ltr">
          <label className="block min-w-0 text-left">
            <span className="mb-2.5 block pl-3 text-[13px] font-semibold text-[#6b6b6b] dark:text-slate-300 sm:text-[14px]">
              {minimumLabel}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={minimumValue}
              onChange={(event) =>
                handleMinimumInputChange(event.target.value)
              }
              placeholder="0"
              className="h-[60px] w-full max-w-[122px] rounded-full border border-[#d9d9d9] bg-white px-5 text-center text-[17px] font-normal text-[#222222] outline-none transition placeholder:text-[#222222] focus:border-[#0A46FF] focus:ring-4 focus:ring-[#0A46FF]/10 dark:border-white/15 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-300 dark:focus:border-[#60a5fa] dark:focus:ring-[#60a5fa]/10"
            />
          </label>

          <label className="flex min-w-0 flex-col items-end text-right">
            <span className="mb-2.5 block pr-3 text-[13px] font-semibold text-[#6b6b6b] dark:text-slate-300 sm:text-[14px]">
              {maximumLabel}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={maximumValue}
              onChange={(event) =>
                handleMaximumInputChange(event.target.value)
              }
              placeholder={maximumPlaceholder}
              className="h-[60px] w-full max-w-[122px] rounded-full border border-[#d9d9d9] bg-white px-5 text-center text-[17px] font-normal text-[#222222] outline-none transition placeholder:text-[#222222] focus:border-[#0A46FF] focus:ring-4 focus:ring-[#0A46FF]/10 dark:border-white/15 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-300 dark:focus:border-[#60a5fa] dark:focus:ring-[#60a5fa]/10"
            />
          </label>
        </div>
      </div>

      <style>{`
        .price-range-filter__slider {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 40px;
          margin: 0;
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
          pointer-events: none;
          outline: none;
        }

        .price-range-filter__slider--minimum {
          z-index: 20;
        }

        .price-range-filter__slider--maximum {
          z-index: 21;
        }

        .price-range-filter__slider::-webkit-slider-runnable-track {
          height: 2px;
          background: transparent;
          border: 0;
        }

        .price-range-filter__slider::-moz-range-track {
          height: 2px;
          background: transparent;
          border: 0;
        }

        .price-range-filter__slider::-webkit-slider-thumb {
          width: 30px;
          height: 30px;
          margin-top: -14px;
          appearance: none;
          -webkit-appearance: none;
          border: 1px solid #d9d9d9;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 8px 28px rgba(15, 23, 42, 0.14);
          cursor: grab;
          pointer-events: auto;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.15s ease;
        }

        .price-range-filter__slider::-moz-range-thumb {
          width: 30px;
          height: 30px;
          border: 1px solid #d9d9d9;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 8px 28px rgba(15, 23, 42, 0.14);
          cursor: grab;
          pointer-events: auto;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.15s ease;
        }

        .price-range-filter__slider:focus-visible::-webkit-slider-thumb,
        .price-range-filter__slider:hover::-webkit-slider-thumb {
          border-color: #0A46FF;
          box-shadow:
            0 8px 28px rgba(15, 23, 42, 0.14),
            0 0 0 5px rgba(10, 70, 255, 0.1);
        }

        .price-range-filter__slider:focus-visible::-moz-range-thumb,
        .price-range-filter__slider:hover::-moz-range-thumb {
          border-color: #0A46FF;
          box-shadow:
            0 8px 28px rgba(15, 23, 42, 0.14),
            0 0 0 5px rgba(10, 70, 255, 0.1);
        }

        .price-range-filter__slider:active::-webkit-slider-thumb {
          cursor: grabbing;
          transform: scale(1.04);
        }

        .price-range-filter__slider:active::-moz-range-thumb {
          cursor: grabbing;
          transform: scale(1.04);
        }

        .dark .price-range-filter__slider::-webkit-slider-thumb {
          border-color: rgba(255, 255, 255, 0.18);
          background: #111827;
        }

        .dark .price-range-filter__slider::-moz-range-thumb {
          border-color: rgba(255, 255, 255, 0.18);
          background: #111827;
        }
      `}</style>
    </div>
  );
}

function NumericFilterInput({
  label,
  value,
  onChange,
  placeholder,
  integerOnly = false,
  hideLabel = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  integerOnly?: boolean;
  hideLabel?: boolean;
}) {
  return (
    <label className="block min-w-0">
      {!hideLabel && (
        <span className="mb-2 block text-[13px] font-semibold text-[#475569] dark:text-slate-300 sm:text-[14px]">
          {label}
        </span>
      )}

      <div className="relative">
        <input
          type="number"
          min="0"
          step={integerOnly ? "1" : "0.01"}
          inputMode={integerOnly ? "numeric" : "decimal"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          dir="ltr"
          className="h-[58px] w-full rounded-[18px] border border-[#dddddd] bg-white px-4 text-[16px] font-semibold text-[#222222] outline-none transition placeholder:text-[#a1a1aa] focus:border-[#0A46FF] focus:ring-4 focus:ring-[#0A46FF]/10 dark:border-white/10 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#60a5fa] dark:focus:ring-[#60a5fa]/10"
        />
      </div>
    </label>
  );
}

export default function SortDropdown({
  isArabic,
  selectedSort,
  sortByLabel,
  genderLabel,
  seasonLabel,
  summerCourseLabel,
  academicYearLabel,
  amenitiesLabel,
  priceRangeLabel,
  minimumPriceLabel,
  maximumPriceLabel,
  floorLabel,
  floorPlaceholder,
  floorHelperLabel,
  showResultsLabel,
  clearAllLabel,
  closeLabel,
  options,
  amenities = [],
  currencyRate = 1,
}: SortDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const groupedOptions = useMemo(
    () => buildSectionedOptions(options),
    [options],
  );
  const safeCurrencyRate = getSafeCurrencyRate(currencyRate);

  const visibleAmenities = useMemo(
    () =>
      [...amenities]
        .filter((amenity) => amenity.is_active !== false)
        .sort((a, b) => {
          const sortA = a.sort_order ?? Number.POSITIVE_INFINITY;
          const sortB = b.sort_order ?? Number.POSITIVE_INFINITY;

          if (sortA !== sortB) return sortA - sortB;

          return a.name_en.localeCompare(b.name_en);
        }),
    [amenities],
  );

  const labels = {
    gender: genderLabel ?? (isArabic ? "النوع" : "Gender"),
    season: seasonLabel ?? (isArabic ? "فترة السكن" : "Stay period"),
    summerCourse:
      summerCourseLabel ?? (isArabic ? "السمر كورس" : "Summer Course"),
    academicYear:
      academicYearLabel ?? (isArabic ? "السنة الجديدة" : "New Academic Year"),
    amenities: amenitiesLabel ?? (isArabic ? "المميزات" : "Amenities"),
    priceRange: priceRangeLabel ?? (isArabic ? "نطاق السعر" : "Price range"),
    minimumPrice:
      minimumPriceLabel ?? (isArabic ? "السعر من" : "Minimum price"),
    maximumPrice:
      maximumPriceLabel ?? (isArabic ? "السعر إلى" : "Maximum price"),
    floor: floorLabel ?? (isArabic ? "الطابق المطلوب" : "Preferred floor"),
    floorPlaceholder: floorPlaceholder ?? (isArabic ? "مثال: 3" : "Example: 3"),
    floorHelper:
      floorHelperLabel ??
      (isArabic ? "اكتب 0 للطابق الأرضي" : "Enter 0 for the ground floor"),
    sortBy: sortByLabel ?? (isArabic ? "ترتيب حسب" : "Sort by"),
    clearAll: clearAllLabel ?? (isArabic ? "مسح الكل" : "Clear all"),
    showResults:
      showResultsLabel ?? (isArabic ? "عرض النتائج" : "Show results"),
    close: closeLabel ?? (isArabic ? "إغلاق" : "Close"),
  };

  const currentGender = useMemo(() => {
    const genderFromParam = normalizeGenderParam(searchParams.get("gender"));
    if (genderFromParam) return genderFromParam;

    const oldGenderFromSort = normalizeGenderParam(searchParams.get("sort"));
    if (oldGenderFromSort) return oldGenderFromSort;

    if (selectedSort === "boys" || selectedSort === "girls")
      return selectedSort;

    return null;
  }, [searchParams, selectedSort]);

  const currentSort = useMemo(() => {
    const sortFromParam = normalizeSortParam(searchParams.get("sort"));
    if (sortFromParam) return sortFromParam;

    if (
      selectedSort === "newly_listed" ||
      selectedSort === "highest_price" ||
      selectedSort === "lowest_price"
    ) {
      return selectedSort;
    }

    return null;
  }, [searchParams, selectedSort]);

  const currentSeason = useMemo(
    () => normalizeSeasonParam(searchParams.get("season")),
    [searchParams],
  );

  const currentAmenityIds = useMemo(
    () => normalizeSelectedAmenityIds(searchParams.get("amenity_ids")),
    [searchParams],
  );

  const currentMinimumPriceEgp = useMemo(
    () => normalizeNonNegativeNumber(searchParams.get("min_price")),
    [searchParams],
  );

  const currentMaximumPriceEgp = useMemo(
    () => normalizeNonNegativeNumber(searchParams.get("max_price")),
    [searchParams],
  );

  const currentFloor = useMemo(
    () => normalizeFloorParam(searchParams.get("floor")),
    [searchParams],
  );

  const currentMinimumPriceInput = useMemo(
    () => convertEgpToDisplayValue(currentMinimumPriceEgp, safeCurrencyRate),
    [currentMinimumPriceEgp, safeCurrencyRate],
  );

  const currentMaximumPriceInput = useMemo(
    () => convertEgpToDisplayValue(currentMaximumPriceEgp, safeCurrencyRate),
    [currentMaximumPriceEgp, safeCurrencyRate],
  );

  const currentFloorInput = currentFloor === null ? "" : String(currentFloor);

  const [tempSelectedGender, setTempSelectedGender] =
    useState<GenderValue | null>(currentGender);
  const [tempSelectedSortOption, setTempSelectedSortOption] =
    useState<SortValue | null>(currentSort);
  const [tempSelectedSeason, setTempSelectedSeason] =
    useState<PricingSeasonCode | null>(currentSeason);
  const [tempSelectedAmenityIds, setTempSelectedAmenityIds] =
    useState<string[]>(currentAmenityIds);
  const [tempMinimumPrice, setTempMinimumPrice] = useState(
    currentMinimumPriceInput,
  );
  const [tempMaximumPrice, setTempMaximumPrice] = useState(
    currentMaximumPriceInput,
  );
  const [tempFloor, setTempFloor] = useState(currentFloorInput);

  const hasActiveFilters =
    currentGender !== null ||
    currentSeason !== null ||
    currentAmenityIds.length > 0 ||
    currentMinimumPriceEgp !== null ||
    currentMaximumPriceEgp !== null ||
    currentFloor !== null ||
    (currentSort !== null && currentSort !== "newly_listed");

  useEffect(() => {
    if (!isOpen) return;

    setTempSelectedGender(currentGender);
    setTempSelectedSortOption(currentSort);
    setTempSelectedSeason(currentSeason);
    setTempSelectedAmenityIds(currentAmenityIds);
    setTempMinimumPrice(currentMinimumPriceInput);
    setTempMaximumPrice(currentMaximumPriceInput);
    setTempFloor(currentFloorInput);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onEscape);
    };
  }, [
    isOpen,
    currentGender,
    currentSort,
    currentSeason,
    currentAmenityIds,
    currentMinimumPriceInput,
    currentMaximumPriceInput,
    currentFloorInput,
  ]);

  const handleToggleGender = (gender: GenderValue) => {
    setTempSelectedGender((value) => (value === gender ? null : gender));
  };

  const handleToggleSeason = (season: PricingSeasonCode) => {
    setTempSelectedSeason((value) => (value === season ? null : season));
  };

  const handleToggleAmenity = (amenityId: string) => {
    setTempSelectedAmenityIds((currentIds) =>
      currentIds.includes(amenityId)
        ? currentIds.filter((id) => id !== amenityId)
        : [...currentIds, amenityId],
    );
  };

  const handleClearAll = () => {
    setTempSelectedGender(null);
    setTempSelectedSortOption(null);
    setTempSelectedSeason(null);
    setTempSelectedAmenityIds([]);
    setTempMinimumPrice("");
    setTempMaximumPrice("");
    setTempFloor("");
  };

  const handleShowResults = () => {
    const nextParams = new URLSearchParams(searchParams.toString());

    nextParams.delete("gender");
    nextParams.delete("sort");
    nextParams.delete("season");
    nextParams.delete("amenity_ids");
    nextParams.delete("min_price");
    nextParams.delete("max_price");
    nextParams.delete("floor");
    nextParams.delete("price_range");
    nextParams.delete("page");

    if (tempSelectedGender) nextParams.set("gender", tempSelectedGender);
    if (tempSelectedSortOption) nextParams.set("sort", tempSelectedSortOption);
    if (tempSelectedSeason) {
      nextParams.set("season", tempSelectedSeason);
    }

    if (tempSelectedAmenityIds.length > 0) {
      nextParams.set("amenity_ids", tempSelectedAmenityIds.join(","));
    }

    const enteredMinimumPrice = normalizeNonNegativeNumber(tempMinimumPrice);
    const enteredMaximumPrice = normalizeNonNegativeNumber(tempMaximumPrice);

    let normalizedMinimumPrice = enteredMinimumPrice;
    let normalizedMaximumPrice = enteredMaximumPrice;

    if (
      normalizedMinimumPrice !== null &&
      normalizedMaximumPrice !== null &&
      normalizedMinimumPrice > normalizedMaximumPrice
    ) {
      [normalizedMinimumPrice, normalizedMaximumPrice] = [
        normalizedMaximumPrice,
        normalizedMinimumPrice,
      ];
    }

    if (normalizedMinimumPrice !== null) {
      nextParams.set(
        "min_price",
        serializeNumber(
          convertDisplayValueToEgp(normalizedMinimumPrice, safeCurrencyRate),
        ),
      );
    }

    if (normalizedMaximumPrice !== null) {
      nextParams.set(
        "max_price",
        serializeNumber(
          convertDisplayValueToEgp(normalizedMaximumPrice, safeCurrencyRate),
        ),
      );
    }

    const normalizedFloor = normalizeFloorParam(tempFloor);
    if (normalizedFloor !== null)
      nextParams.set("floor", String(normalizedFloor));

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    setIsOpen(false);
    router.push(nextUrl);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        dir={isArabic ? "rtl" : "ltr"}
        className="relative inline-flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[#dddddd] bg-white p-0 text-[#222222] transition hover:shadow-sm dark:border-white/10 dark:bg-[#0b1220] dark:text-slate-100 dark:hover:bg-[#111827] md:h-[48px] md:w-auto md:gap-2 md:px-5"
        aria-label={labels.sortBy}
      >
        <FilterIcon />
        <span className="hidden md:inline">{labels.sortBy}</span>

        {hasActiveFilters && (
          <span
            className={`absolute top-[5px] h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0A46FF] dark:border-[#0b1220] md:top-[7px] ${
              isArabic ? "left-[5px] md:left-2" : "right-[5px] md:right-2"
            }`}
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/35 dark:bg-black/60"
          onClick={() => setIsOpen(false)}
        >
          <div
            dir={isArabic ? "rtl" : "ltr"}
            onClick={(event) => event.stopPropagation()}
            className="absolute bottom-[calc(76px+env(safe-area-inset-bottom,0px))] left-0 right-0 top-auto flex max-h-[calc(100dvh-96px)] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-12px_50px_rgba(0,0,0,0.20)] dark:border dark:border-white/10 dark:bg-[#0b1220] dark:shadow-[0_-16px_60px_rgba(0,0,0,0.48)] sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-8 sm:h-[min(800px,calc(100vh-64px))] sm:max-h-none sm:w-[min(92vw,620px)] sm:-translate-x-1/2 sm:rounded-[28px]"
          >
            <div className="relative flex h-[72px] shrink-0 items-center justify-center border-b border-[#ebebeb] px-5 dark:border-white/10 sm:h-[76px] sm:px-6">
              <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-[#222222] dark:text-slate-100">
                {labels.sortBy}
              </h3>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[#222222] transition hover:bg-[#f7f7f7] dark:text-slate-100 dark:hover:bg-white/10 ${
                  isArabic ? "left-5 sm:left-6" : "right-5 sm:right-6"
                }`}
                aria-label={labels.close}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-6 sm:flex-1 sm:px-7 sm:py-7">
              <section className="border-b border-[#ebebeb] pb-7 dark:border-white/10">
                <h4 className="mb-5 text-[18px] font-semibold tracking-[-0.02em] text-[#222222] dark:text-slate-100">
                  {labels.gender}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {groupedOptions.gender.map((option) => (
                    <GenderCard
                      key={option.value}
                      option={option}
                      isActive={option.value === tempSelectedGender}
                      onSelect={() =>
                        handleToggleGender(option.value as GenderValue)
                      }
                    />
                  ))}
                </div>
              </section>

              <section className="border-b border-[#ebebeb] py-7 dark:border-white/10">
                <h4 className="mb-5 text-[18px] font-semibold tracking-[-0.02em] text-[#222222] dark:text-slate-100">
                  {labels.season}
                </h4>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <SeasonCard
                    value="academic_year"
                    label={labels.academicYear}
                    isActive={tempSelectedSeason === "academic_year"}
                    onSelect={() => handleToggleSeason("academic_year")}
                  />

                  <SeasonCard
                    value="summer_course"
                    label={labels.summerCourse}
                    isActive={tempSelectedSeason === "summer_course"}
                    onSelect={() => handleToggleSeason("summer_course")}
                  />
                </div>
              </section>

              <section className="border-b border-[#ebebeb] py-7 dark:border-white/10">
                <h4 className="mb-5 text-[24px] font-semibold tracking-[-0.025em] text-[#222222] dark:text-slate-100 sm:text-[26px]">
                  {labels.priceRange}
                </h4>

                <PriceRangeFilter
                  isArabic={isArabic}
                  minimumLabel={labels.minimumPrice}
                  maximumLabel={labels.maximumPrice}
                  minimumValue={tempMinimumPrice}
                  maximumValue={tempMaximumPrice}
                  onMinimumChange={setTempMinimumPrice}
                  onMaximumChange={setTempMaximumPrice}
                  currencyRate={safeCurrencyRate}
                />
              </section>

              <section className="border-b border-[#ebebeb] py-7 dark:border-white/10">
                <h4 className="mb-5 text-[18px] font-semibold tracking-[-0.02em] text-[#222222] dark:text-slate-100">
                  {labels.floor}
                </h4>

                <NumericFilterInput
                  label={labels.floor}
                  value={tempFloor}
                  onChange={setTempFloor}
                  placeholder={labels.floorPlaceholder}
                  integerOnly
                  hideLabel
                />

                <p className="mt-2.5 text-[12px] font-medium text-[#64748b] dark:text-slate-400">
                  {labels.floorHelper}
                </p>
              </section>

              {visibleAmenities.length > 0 && (
                <section className="border-b border-[#ebebeb] py-7 dark:border-white/10">
                  <h4 className="mb-5 text-[18px] font-semibold tracking-[-0.02em] text-[#222222] dark:text-slate-100">
                    {labels.amenities}
                  </h4>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-6">
                    {visibleAmenities.map((amenity) => {
                      const label = isArabic
                        ? amenity.name_ar || amenity.name_en
                        : amenity.name_en;

                      return (
                        <AmenityCard
                          key={amenity.id}
                          amenity={amenity}
                          label={label}
                          isActive={tempSelectedAmenityIds.includes(amenity.id)}
                          onToggle={() => handleToggleAmenity(amenity.id)}
                        />
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="pt-7">
                <h4 className="mb-5 text-[18px] font-semibold tracking-[-0.02em] text-[#222222] dark:text-slate-100">
                  {labels.sortBy}
                </h4>

                <div className="rounded-[22px] border border-[#dddddd] bg-white p-[6px] dark:border-white/10 dark:bg-[#111827]">
                  <div className="grid grid-cols-3 gap-[6px]">
                    {groupedOptions.sortBy.map((option) => {
                      const isActive = option.value === tempSelectedSortOption;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setTempSelectedSortOption((currentValue) =>
                              currentValue === option.value
                                ? null
                                : (option.value as SortValue),
                            )
                          }
                          className={`flex min-h-[54px] items-center justify-center rounded-[18px] border-2 px-2 text-center text-[13px] font-medium leading-snug transition sm:h-[54px] sm:px-3 sm:text-[14px] ${
                            isActive
                              ? "border-[#0A46FF] bg-white text-[#222222] dark:border-[#60a5fa] dark:bg-[#0b1220] dark:text-slate-100"
                              : "border-transparent bg-white text-[#222222] hover:bg-[#f7f7f7] dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            <div className="shrink-0 border-t border-[#ececec] bg-[#fbfbfb] px-5 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#0f172a] dark:shadow-[0_-10px_28px_rgba(0,0,0,0.28)] sm:mt-auto sm:px-7 sm:py-5">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[14px] font-semibold text-[#8d8d8d] transition hover:text-[#0A46FF] dark:text-slate-400 dark:hover:text-[#60a5fa] sm:text-[15px]"
                >
                  {labels.clearAll}
                </button>

                <button
                  type="button"
                  onClick={handleShowResults}
                  className="inline-flex h-[54px] min-w-[170px] items-center justify-center rounded-[16px] bg-[#0A46FF] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0838cc] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8] sm:h-[56px] sm:min-w-[210px] sm:px-6 sm:text-[15px]"
                >
                  {labels.showResults}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
