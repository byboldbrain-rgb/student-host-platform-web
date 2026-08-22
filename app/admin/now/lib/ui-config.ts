export type EmployeeFieldKind =
  | 'boolean'
  | 'number'
  | 'json'
  | 'time'
  | 'datetime'
  | 'textarea'
  | 'url'
  | 'email'
  | 'phone'
  | 'text';

export type SelectOption = { value: string; label: string };

const FIELD_LABELS: Record<string, string> = {
  id: 'المعرّف',
  user_id: 'المستخدم',
  code: 'الكود',
  slug: 'الرابط المختصر',
  name_ar: 'الاسم بالعربية',
  name_en: 'الاسم بالإنجليزية',
  title_ar: 'العنوان بالعربية',
  title_en: 'العنوان بالإنجليزية',
  subtitle_ar: 'العنوان الفرعي بالعربية',
  subtitle_en: 'العنوان الفرعي بالإنجليزية',
  description_ar: 'الوصف بالعربية',
  description_en: 'الوصف بالإنجليزية',
  short_description_ar: 'الوصف المختصر بالعربية',
  short_description_en: 'الوصف المختصر بالإنجليزية',
  full_description_ar: 'الوصف الكامل بالعربية',
  full_description_en: 'الوصف الكامل بالإنجليزية',
  image_url: 'رابط الصورة',
  logo_url: 'شعار المتجر',
  cover_image_url: 'صورة الغلاف',
  icon: 'الأيقونة',
  icon_url: 'رابط الأيقونة',
  alt_text_ar: 'وصف الصورة بالعربية',
  alt_text_en: 'وصف الصورة بالإنجليزية',
  storage_path: 'مسار الملف في التخزين',
  is_active: 'نشط',
  is_available: 'متاح',
  is_visible: 'ظاهر للعميل',
  is_featured: 'مميز',
  is_default: 'الخيار الافتراضي',
  is_cover: 'الصورة الرئيسية',
  sort_order: 'ترتيب الظهور',
  priority: 'الأولوية',
  category_id: 'الفئة',
  catalog_category_id: 'قسم المنتج',
  parent_id: 'القسم الرئيسي',
  city_id: 'المدينة',
  store_id: 'المتجر',
  product_id: 'المنتج',
  product_variant_id: 'خيار المنتج',
  banner_id: 'البانر',
  service_area_id: 'منطقة الخدمة',
  payment_method_id: 'طريقة الدفع',
  service_package_id: 'باقة الخدمة',
  voucher_id: 'الكوبون',
  phone: 'رقم الهاتف',
  customer_phone: 'رقم العميل',
  whatsapp_number: 'رقم واتساب',
  email: 'البريد الإلكتروني',
  address: 'العنوان',
  address_line_ar: 'العنوان بالعربية',
  address_line_en: 'العنوان بالإنجليزية',
  landmark: 'علامة مميزة',
  latitude: 'خط العرض',
  longitude: 'خط الطول',
  average_preparation_minutes: 'متوسط وقت التجهيز بالدقائق',
  delivery_time_label_ar: 'وصف وقت التوصيل',
  is_manually_closed: 'إغلاق المتجر يدويًا',
  manual_closed_note_ar: 'رسالة الإغلاق بالعربية',
  manual_closed_note_en: 'رسالة الإغلاق بالإنجليزية',
  day_of_week: 'اليوم',
  is_open: 'المتجر مفتوح',
  open_time: 'وقت الفتح',
  close_time: 'وقت الإغلاق',
  delivery_fee: 'رسوم التوصيل',
  minimum_order_amount: 'الحد الأدنى للطلب',
  estimated_delivery_minutes: 'وقت التوصيل المتوقع بالدقائق',
  default_delivery_fee: 'رسوم التوصيل الافتراضية',
  default_minimum_order_amount: 'الحد الأدنى الافتراضي للطلب',
  default_estimated_delivery_minutes: 'وقت التوصيل الافتراضي بالدقائق',
  boundary_points: 'حدود منطقة الخدمة',
  product_type: 'نوع المنتج',
  base_price: 'السعر',
  price: 'السعر',
  compare_at_price: 'السعر قبل الخصم',
  sku: 'SKU',
  barcode: 'الباركود',
  unit_label_ar: 'وحدة البيع بالعربية',
  unit_label_en: 'وحدة البيع بالإنجليزية',
  requires_prescription: 'يتطلب روشتة',
  is_age_restricted: 'مقيد بالعمر',
  metadata: 'بيانات إضافية',
  admin_label: 'اسم داخلي للبانر',
  link_url: 'رابط البانر',
  audience: 'الجمهور',
  placement: 'مكان الظهور',
  starts_at: 'يبدأ في',
  ends_at: 'ينتهي في',
  presentation_type: 'طريقة العرض',
  action_type: 'الإجراء عند الضغط',
  action_payload: 'تفاصيل الإجراء',
  template_key: 'قالب التصميم',
  content: 'محتوى البانر',
  theme: 'ألوان وتصميم البانر',
  discount_type: 'نوع الخصم',
  discount_value: 'قيمة الخصم',
  discount_target: 'الخصم على',
  max_discount_amount: 'أقصى قيمة للخصم',
  minimum_subtotal: 'الحد الأدنى لقيمة الطلب',
  max_redemptions_total: 'أقصى عدد استخدامات',
  max_redemptions_per_user: 'أقصى استخدامات لكل عميل',
  first_order_only: 'لأول طلب فقط',
  label: 'اسم الحساب',
  account_name: 'اسم صاحب الحساب',
  account_number: 'رقم الحساب / المحفظة',
  iban: 'IBAN',
  qr_image_url: 'صورة QR',
  instructions_ar: 'تعليمات الدفع بالعربية',
  instructions_en: 'تعليمات الدفع بالإنجليزية',
  processing_fee_enabled: 'تفعيل رسوم المعالجة',
  processing_fee_type: 'نوع رسوم المعالجة',
  processing_fee_percentage: 'نسبة رسوم المعالجة %',
  processing_fee_fixed_amount: 'قيمة رسوم المعالجة',
  processing_fee_min_amount: 'الحد الأدنى للرسوم',
  processing_fee_max_amount: 'الحد الأقصى للرسوم',
  processing_fee_charge_customer: 'تحميل الرسوم على العميل',
  processing_fee_label_ar: 'اسم الرسوم بالعربية',
  processing_fee_label_en: 'اسم الرسوم بالإنجليزية',
  requires_payment_proof: 'يتطلب إثبات دفع',
  role: 'الدور الوظيفي',
  can_view_orders: 'يمكنه مشاهدة الطلبات',
  can_manage_orders: 'يمكنه إدارة الطلبات',
  can_manage_catalog: 'يمكنه إدارة المتاجر والمنتجات',
  can_manage_finance: 'يمكنه إدارة الدفع',
  can_manage_settings: 'يمكنه إدارة الإعدادات',
  currency_code: 'كود العملة',
  currency_symbol: 'رمز العملة',
  notes: 'ملاحظات',
  note: 'ملاحظة',
};

const FIELD_HELP: Record<string, string> = {
  slug: 'استخدم حروف إنجليزية صغيرة وأرقام وشرطة - بدون مسافات.',
  sort_order: 'الرقم الأصغر يظهر أولًا.',
  is_active: 'أوقفه بدل الحذف عندما تريد إخفاء العنصر مؤقتًا.',
  is_available: 'يمكن إيقاف التوفر مؤقتًا بدون حذف العنصر.',
  is_manually_closed: 'استخدمه لإغلاق المتجر فورًا حتى لو كان داخل مواعيد العمل.',
  base_price: 'السعر الذي سيظهر للعميل قبل إضافة الرسوم.',
  compare_at_price: 'اختياري؛ يظهر كسعر قديم عند وجود خصم.',
  starts_at: 'اتركه فارغًا إذا كان العنصر يبدأ فورًا.',
  ends_at: 'اتركه فارغًا إذا لم يوجد تاريخ انتهاء.',
  boundary_points: 'إعداد متقدم لحدود الخريطة. لا تعدله إلا إذا كنت مسؤولًا عن التغطية.',
  metadata: 'إعدادات إضافية متقدمة. غالبًا لا تحتاج لتعديلها.',
  action_payload: 'إعداد متقدم يحدد الوجهة أو البيانات المرسلة عند الضغط على البانر.',
  content: 'محتوى تصميم متقدم للبانر.',
  theme: 'ألوان وإعدادات تصميم متقدمة للبانر.',
  max_redemptions_total: 'اتركه فارغًا لعدم وضع حد إجمالي.',
  max_redemptions_per_user: 'اتركه فارغًا لعدم وضع حد لكل عميل.',
};

const OPTIONS: Record<string, SelectOption[]> = {
  day_of_week: [
    { value: '0', label: 'الأحد' },
    { value: '1', label: 'الاثنين' },
    { value: '2', label: 'الثلاثاء' },
    { value: '3', label: 'الأربعاء' },
    { value: '4', label: 'الخميس' },
    { value: '5', label: 'الجمعة' },
    { value: '6', label: 'السبت' },
  ],
  audience: [
    { value: 'all', label: 'كل المستخدمين' },
    { value: 'signed_out', label: 'غير المسجلين فقط' },
    { value: 'signed_in', label: 'المسجلين فقط' },
  ],
  placement: [
    { value: 'main', label: 'الرئيسية' },
    { value: 'exclusive_offers', label: 'العروض الحصرية' },
    { value: 'supermarket', label: 'السوبرماركت' },
    { value: 'pharmacy', label: 'الصيدلية' },
  ],
  presentation_type: [
    { value: 'direct_link', label: 'يفتح الوجهة مباشرة' },
    { value: 'detail_screen', label: 'يفتح صفحة تفاصيل' },
  ],
  action_type: [
    { value: 'none', label: 'بدون إجراء' },
    { value: 'whatsapp', label: 'فتح واتساب' },
    { value: 'external_url', label: 'فتح رابط خارجي' },
    { value: 'category', label: 'فتح قسم' },
    { value: 'store', label: 'فتح متجر' },
    { value: 'route', label: 'فتح صفحة داخل التطبيق' },
    { value: 'service_checkout', label: 'فتح حجز خدمة' },
  ],
  product_type: [
    { value: 'food', label: 'مطعم / طعام' },
    { value: 'grocery', label: 'سوبرماركت / بقالة' },
    { value: 'pharmacy', label: 'صيدلية' },
  ],
  processing_fee_type: [
    { value: 'none', label: 'بدون رسوم' },
    { value: 'fixed', label: 'قيمة ثابتة' },
    { value: 'percentage', label: 'نسبة مئوية' },
  ],
  discount_type: [
    { value: 'fixed', label: 'قيمة ثابتة' },
    { value: 'percentage', label: 'نسبة مئوية' },
  ],
  discount_target: [
    { value: 'order_subtotal', label: 'قيمة المنتجات' },
    { value: 'delivery_fee', label: 'رسوم التوصيل' },
  ],
  role: [
    { value: 'operations', label: 'تشغيل الطلبات' },
    { value: 'customer_support', label: 'خدمة العملاء' },
    { value: 'catalog_manager', label: 'إدارة المتاجر والمنتجات' },
    { value: 'finance', label: 'المالية والدفع' },
    { value: 'viewer', label: 'مشاهدة فقط' },
  ],
};

const SYSTEM_COLUMNS = new Set([
  'created_at',
  'updated_at',
  'rating_avg',
  'rating_count',
  'created_by',
  'reviewed_at',
  'reviewed_by_user_id',
]);

export function getFieldLabel(column: string) {
  return FIELD_LABELS[column] ?? column.replaceAll('_', ' ');
}

export function getFieldHelp(column: string) {
  return FIELD_HELP[column] ?? null;
}

export function getFieldOptions(column: string) {
  return OPTIONS[column] ?? null;
}

export function isSystemManagedColumn(column: string) {
  return SYSTEM_COLUMNS.has(column);
}

export function inferFieldKind(column: string, dataType?: string, value?: unknown): EmployeeFieldKind {
  if (dataType === 'boolean' || typeof value === 'boolean') return 'boolean';
  if (['smallint', 'integer', 'bigint', 'numeric', 'real', 'double precision', 'decimal'].includes(dataType ?? '') || typeof value === 'number') return 'number';
  if (dataType === 'jsonb' || dataType === 'json' || (value !== null && typeof value === 'object')) return 'json';
  if (dataType === 'time without time zone' || dataType === 'time with time zone') return 'time';
  if (dataType?.startsWith('timestamp')) return 'datetime';
  if (column.includes('description') || column.includes('instructions') || column.includes('message') || column.includes('notes') || column.includes('note')) return 'textarea';
  if (column.endsWith('_url') || column.includes('image_url')) return 'url';
  if (column.includes('email')) return 'email';
  if (column.includes('phone') || column.includes('whatsapp') || column.includes('account_number')) return 'phone';
  return 'text';
}

export function formatEmployeeValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'object') return 'بيانات متقدمة';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Cairo',
      }).format(date);
    }
  }
  return text;
}
