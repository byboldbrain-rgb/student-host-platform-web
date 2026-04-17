import Link from "next/link";
import type { HealthDoctorSummary } from "@/src/lib/services/health/types";

type Props = {
  doctor: HealthDoctorSummary;
  language?: "en" | "ar";
  currency?: string;
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3">
      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f3fc] text-[#1683df]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#8a8f98]">{label}</p>
        <div className="mt-1 break-words text-[15px] font-semibold text-[#25303b]">
          {value}
        </div>
      </div>
    </div>
  );
}

function FeeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
      <path d="M12 3v18" />
      <path d="M16.5 7.5c0-1.93-2.01-3.5-4.5-3.5S7.5 5.57 7.5 7.5 9.51 11 12 11s4.5 1.57 4.5 3.5S14.49 18 12 18s-4.5-1.57-4.5-3.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.59a16 16 0 0 0 6.41 6.41l1.14-1.29a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12.04 2C6.55 2 2.1 6.45 2.1 11.94c0 1.76.46 3.47 1.34 4.98L2 22l5.24-1.37a9.9 9.9 0 004.8 1.23h.01c5.49 0 9.95-4.45 9.95-9.94A9.95 9.95 0 0012.04 2zm5.82 14.09c-.24.67-1.4 1.28-1.93 1.36-.5.07-1.13.1-1.82-.12-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.75-4.14-4.9-4.34-.15-.2-1.17-1.56-1.17-2.98 0-1.42.74-2.12 1-2.42.26-.3.57-.37.76-.37.19 0 .38 0 .55.01.18.01.42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.33.02.53-.1.2-.15.33-.3.5-.15.17-.31.38-.44.51-.15.15-.31.31-.13.6.18.3.82 1.35 1.75 2.19 1.2 1.07 2.21 1.4 2.52 1.56.31.15.49.13.67-.08.18-.2.77-.9.98-1.21.2-.31.41-.26.69-.15.29.1 1.8.85 2.11 1 .31.15.51.22.58.34.07.12.07.69-.17 1.36z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
      <path d="M12 21s7-5.69 7-11a7 7 0 1 0-14 0c0 5.31 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function DoctorCard({
  doctor,
  language = "ar",
  currency = "EGP",
}: Props) {
  const isArabic = language === "ar";

  const primarySpecialty =
    doctor.specialties.find((item) => item.is_primary) ?? doctor.specialties[0];

  const firstClinic = doctor.clinics[0];

  const doctorName = isArabic
    ? doctor.full_name_ar || doctor.full_name_en || "طبيب"
    : doctor.full_name_en || doctor.full_name_ar || "Doctor";

  const doctorTitle = isArabic
    ? doctor.title_ar || doctor.title_en || ""
    : doctor.title_en || doctor.title_ar || "";

  const specialtyName = primarySpecialty
    ? isArabic
      ? primarySpecialty.name_ar || primarySpecialty.name_en
      : primarySpecialty.name_en || primarySpecialty.name_ar
    : isArabic
      ? "تخصص غير محدد"
      : "No specialty";

  const consultationFee =
    firstClinic?.consultation_fee ?? doctor.consultation_fee ?? null;

  const clinicPhone = firstClinic?.phone || null;
  const clinicWhatsapp = firstClinic?.whatsapp_number || null;
  const clinicAddress = firstClinic?.address_line || null;
  const clinicCity = isArabic
    ? firstClinic?.city_name_ar || firstClinic?.city_name_en || null
    : firstClinic?.city_name_en || firstClinic?.city_name_ar || null;

  const discountPercentage = firstClinic?.discount_percentage ?? null;

  const discountTitle = isArabic
    ? firstClinic?.discount_title_ar || firstClinic?.discount_title_en
    : firstClinic?.discount_title_en || firstClinic?.discount_title_ar;

  const whatsappHref = clinicWhatsapp
    ? `https://wa.me/${clinicWhatsapp.replace(/[^\d]/g, "")}`
    : null;

  return (
    <article
      dir={isArabic ? "rtl" : "ltr"}
      className="group overflow-hidden rounded-[28px] border border-[#dce6ee] bg-gradient-to-br from-[#f7fbff] via-[#eef5fb] to-[#e8f0f7] shadow-[0_10px_30px_rgba(22,131,223,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(22,131,223,0.14)]"
    >
      <div className="p-5 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="rounded-[24px] bg-white/92 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/services/health/doctors/${doctor.slug}`}
                        className="block truncate text-[24px] font-bold leading-tight text-[#1683df] transition hover:text-[#0d6fc4] hover:underline"
                      >
                        {doctorName}
                      </Link>

                      <p className="mt-2 text-[16px] font-medium text-[#6f7a86]">
                        {doctorTitle || specialtyName}
                      </p>

                      {discountPercentage && discountPercentage > 0 ? (
                        <div className="mt-4 inline-flex items-center rounded-full border border-[#c9f0d9] bg-[#ecfff4] px-4 py-1.5 text-sm font-bold text-[#179c52]">
                          {discountTitle
                            ? `${discountTitle} - ${discountPercentage}%`
                            : isArabic
                              ? `خصم ${discountPercentage}%`
                              : `${discountPercentage}% Discount`}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <div className="relative h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] lg:h-[150px] lg:w-[150px]">
                  {doctor.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doctor.photo_url}
                      alt={doctorName}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#f2f5f8] text-center text-sm text-[#9ba4ae]">
                      {isArabic ? "صورة الطبيب" : "Doctor photo"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoRow
                icon={<FeeIcon />}
                label={isArabic ? "سعر الكشف" : "Fees"}
                value={
                  consultationFee
                    ? `${consultationFee} ${currency}`
                    : isArabic
                      ? "غير محدد"
                      : "Not specified"
                }
              />

              <InfoRow
                icon={<LocationIcon />}
                label={isArabic ? "المدينة" : "City"}
                value={
                  clinicCity
                    ? clinicCity
                    : isArabic
                      ? "غير محدد"
                      : "Not specified"
                }
              />

              <InfoRow
                icon={<PhoneIcon />}
                label={isArabic ? "هاتف العيادة" : "Clinic phone"}
                value={
                  clinicPhone ? (
                    <a
                      href={`tel:${clinicPhone}`}
                      className="text-[#1683df] transition hover:text-[#0d6fc4] hover:underline"
                    >
                      {clinicPhone}
                    </a>
                  ) : isArabic ? (
                    "غير محدد"
                  ) : (
                    "Not specified"
                  )
                }
              />

              <InfoRow
                icon={
                  <span className="text-[#25D366]">
                    <WhatsappIcon />
                  </span>
                }
                label={isArabic ? "واتساب العيادة" : "Clinic WhatsApp"}
                value={
                  clinicWhatsapp ? (
                    whatsappHref ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1683df] transition hover:text-[#0d6fc4] hover:underline"
                      >
                        {clinicWhatsapp}
                      </a>
                    ) : (
                      clinicWhatsapp
                    )
                  ) : isArabic ? (
                    "غير محدد"
                  ) : (
                    "Not specified"
                  )
                }
              />

              <InfoRow
                icon={<LocationIcon />}
                label={isArabic ? "عنوان العيادة" : "Clinic address"}
                value={
                  clinicAddress
                    ? clinicAddress
                    : isArabic
                      ? "غير محدد"
                      : "Not specified"
                }
              />
            </div>

            {(clinicPhone || whatsappHref) && (
              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                {clinicPhone ? (
                  <a
                    href={`tel:${clinicPhone}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-[#1683df] bg-white px-5 py-3 text-sm font-bold text-[#1683df] transition hover:bg-[#f2f8fe]"
                  >
                    {isArabic ? "اتصال الآن" : "Call now"}
                  </a>
                ) : null}

                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:brightness-95"
                  >
                    {isArabic ? "تواصل واتساب" : "WhatsApp"}
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}