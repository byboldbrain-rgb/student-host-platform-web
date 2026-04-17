BEGIN;

-- =========================================================
-- 1) Extend admin_users.department to support health
-- =========================================================

ALTER TABLE public.admin_users
DROP CONSTRAINT IF EXISTS admin_users_department_check;

ALTER TABLE public.admin_users
ADD CONSTRAINT admin_users_department_check
CHECK (
  department IS NULL OR department = ANY (
    ARRAY[
      'properties'::text,
      'services'::text,
      'career'::text,
      'food_grocery'::text,
      'health'::text
    ]
  )
);

-- =========================================================
-- 2) Insert Health service category
-- =========================================================

INSERT INTO public.service_categories (
  slug,
  name_en,
  name_ar,
  sort_order,
  is_active,
  icon
)
VALUES (
  'health',
  'Health',
  'الصحة',
  20,
  true,
  'stethoscope'
)
ON CONFLICT (slug) DO UPDATE
SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  icon = EXCLUDED.icon,
  updated_at = now();

-- =========================================================
-- 3) Insert Health specialties into service_subcategories
-- =========================================================

INSERT INTO public.service_subcategories (
  category_id,
  slug,
  name_en,
  name_ar,
  icon,
  sort_order,
  is_active
)
SELECT
  sc.id,
  x.slug,
  x.name_en,
  x.name_ar,
  x.icon,
  x.sort_order,
  true
FROM public.service_categories sc
CROSS JOIN (
  VALUES
    ('dentistry', 'Dentistry', 'الأسنان', 'tooth', 1),
    ('dermatology', 'Dermatology', 'الجلدية', 'sparkles', 2),
    ('psychiatry', 'Psychiatry', 'الطب النفسي', 'brain', 3),
    ('orthopedics', 'Orthopedics', 'العظام', 'bone', 4),
    ('ent', 'ENT', 'أنف وأذن وحنجرة', 'ear', 5),
    ('pediatrics', 'Pediatrics', 'الأطفال', 'baby', 6),
    ('gynecology', 'Gynecology', 'النساء والتوليد', 'heart-pulse', 7),
    ('cardiology', 'Cardiology', 'القلب', 'heart', 8),
    ('ophthalmology', 'Ophthalmology', 'العيون', 'eye', 9),
    ('nutrition', 'Nutrition', 'التغذية', 'apple', 10)
) AS x(slug, name_en, name_ar, icon, sort_order)
WHERE sc.slug = 'health'
  AND NOT EXISTS (
    SELECT 1
    FROM public.service_subcategories ssc
    WHERE ssc.category_id = sc.id
      AND ssc.slug = x.slug
  );

-- =========================================================
-- 4) Health tables
-- =========================================================

-- 4.1 Doctors
CREATE TABLE IF NOT EXISTS public.health_doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  full_name_en text NOT NULL,
  full_name_ar text,
  title_en text,
  title_ar text,
  gender text CHECK (gender IN ('male', 'female')),
  bio_en text,
  bio_ar text,
  photo_url text,
  years_of_experience integer CHECK (years_of_experience IS NULL OR years_of_experience >= 0),
  consultation_fee numeric CHECK (consultation_fee IS NULL OR consultation_fee >= 0),
  rating_avg numeric NOT NULL DEFAULT 0 CHECK (rating_avg >= 0),
  rating_count integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  extra_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT health_doctors_pkey PRIMARY KEY (id)
);

-- 4.2 Doctor specialties
CREATE TABLE IF NOT EXISTS public.health_doctor_specialties (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES public.health_doctors(id) ON DELETE CASCADE,
  subcategory_id bigint NOT NULL REFERENCES public.service_subcategories(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, subcategory_id)
);

-- 4.3 Doctor clinics
CREATE TABLE IF NOT EXISTS public.health_doctor_clinics (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES public.health_doctors(id) ON DELETE CASCADE,
  clinic_provider_id bigint NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  job_title_en text,
  job_title_ar text,
  consultation_fee numeric CHECK (consultation_fee IS NULL OR consultation_fee >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, clinic_provider_id)
);

-- 4.4 Doctor schedules
CREATE TABLE IF NOT EXISTS public.health_doctor_schedules (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_clinic_id bigint NOT NULL REFERENCES public.health_doctor_clinics(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_active boolean NOT NULL DEFAULT true,
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 30 CHECK (slot_duration_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT health_doctor_schedules_time_check CHECK (start_time < end_time)
);

-- 4.5 Doctor unavailable dates
CREATE TABLE IF NOT EXISTS public.health_doctor_unavailable_dates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES public.health_doctors(id) ON DELETE CASCADE,
  clinic_provider_id bigint REFERENCES public.service_providers(id) ON DELETE CASCADE,
  unavailable_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4.6 Appointments
CREATE TABLE IF NOT EXISTS public.health_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.health_doctors(id),
  clinic_provider_id bigint NOT NULL REFERENCES public.service_providers(id),
  specialty_subcategory_id bigint REFERENCES public.service_subcategories(id),
  patient_name text NOT NULL,
  patient_phone text NOT NULL,
  patient_email text,
  patient_whatsapp text,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  end_time time,
  booking_source text NOT NULL DEFAULT 'website'
    CHECK (booking_source IN ('website', 'manual', 'call', 'whatsapp')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  handled_by_admin_id uuid REFERENCES public.admin_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT health_appointments_pkey PRIMARY KEY (id)
);

-- =========================================================
-- 5) Helpful indexes
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_health_doctors_slug
  ON public.health_doctors(slug);

CREATE INDEX IF NOT EXISTS idx_health_doctors_is_active
  ON public.health_doctors(is_active);

CREATE INDEX IF NOT EXISTS idx_health_doctors_is_featured
  ON public.health_doctors(is_featured);

CREATE INDEX IF NOT EXISTS idx_health_doctor_specialties_doctor_id
  ON public.health_doctor_specialties(doctor_id);

CREATE INDEX IF NOT EXISTS idx_health_doctor_specialties_subcategory_id
  ON public.health_doctor_specialties(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_health_doctor_clinics_doctor_id
  ON public.health_doctor_clinics(doctor_id);

CREATE INDEX IF NOT EXISTS idx_health_doctor_clinics_clinic_provider_id
  ON public.health_doctor_clinics(clinic_provider_id);

CREATE INDEX IF NOT EXISTS idx_health_doctor_clinics_is_active
  ON public.health_doctor_clinics(is_active);

CREATE INDEX IF NOT EXISTS idx_health_doctor_schedules_doctor_clinic_id
  ON public.health_doctor_schedules(doctor_clinic_id);

CREATE INDEX IF NOT EXISTS idx_health_doctor_schedules_day_of_week
  ON public.health_doctor_schedules(day_of_week);

CREATE INDEX IF NOT EXISTS idx_health_doctor_unavailable_dates_doctor_id
  ON public.health_doctor_unavailable_dates(doctor_id);

CREATE INDEX IF NOT EXISTS idx_health_doctor_unavailable_dates_clinic_provider_id
  ON public.health_doctor_unavailable_dates(clinic_provider_id);

CREATE INDEX IF NOT EXISTS idx_health_doctor_unavailable_dates_date
  ON public.health_doctor_unavailable_dates(unavailable_date);

CREATE INDEX IF NOT EXISTS idx_health_appointments_doctor_id
  ON public.health_appointments(doctor_id);

CREATE INDEX IF NOT EXISTS idx_health_appointments_clinic_provider_id
  ON public.health_appointments(clinic_provider_id);

CREATE INDEX IF NOT EXISTS idx_health_appointments_specialty_subcategory_id
  ON public.health_appointments(specialty_subcategory_id);

CREATE INDEX IF NOT EXISTS idx_health_appointments_date
  ON public.health_appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_health_appointments_status
  ON public.health_appointments(status);

CREATE INDEX IF NOT EXISTS idx_health_appointments_doctor_clinic_date_time
  ON public.health_appointments(doctor_id, clinic_provider_id, appointment_date, appointment_time);

-- =========================================================
-- 6) updated_at trigger helper
-- =========================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- 7) updated_at triggers for health tables
-- =========================================================

DROP TRIGGER IF EXISTS trg_health_doctors_updated_at
ON public.health_doctors;

CREATE TRIGGER trg_health_doctors_updated_at
BEFORE UPDATE ON public.health_doctors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_health_doctor_schedules_updated_at
ON public.health_doctor_schedules;

CREATE TRIGGER trg_health_doctor_schedules_updated_at
BEFORE UPDATE ON public.health_doctor_schedules
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_health_appointments_updated_at
ON public.health_appointments;

CREATE TRIGGER trg_health_appointments_updated_at
BEFORE UPDATE ON public.health_appointments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 8) Optional data integrity constraints
-- =========================================================

-- Allow only one primary specialty per doctor
CREATE UNIQUE INDEX IF NOT EXISTS idx_health_doctor_specialties_one_primary
  ON public.health_doctor_specialties(doctor_id)
  WHERE is_primary = true;

-- Prevent exact duplicate unavailable dates for the same doctor/clinic/date
CREATE UNIQUE INDEX IF NOT EXISTS idx_health_doctor_unavailable_unique
  ON public.health_doctor_unavailable_dates(
    doctor_id,
    COALESCE(clinic_provider_id, 0),
    unavailable_date
  );

-- Prevent exact duplicate appointment slot for same doctor/clinic/date/time
-- Note: this blocks double-booking at DB level
CREATE UNIQUE INDEX IF NOT EXISTS idx_health_appointments_unique_slot
  ON public.health_appointments(
    doctor_id,
    clinic_provider_id,
    appointment_date,
    appointment_time
  )
  WHERE status IN ('pending', 'confirmed');

COMMIT;