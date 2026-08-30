import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | Navienty Now',
  description: 'سياسة الخصوصية الخاصة بتطبيق وخدمات Navienty Now.',
  alternates: {
    canonical: 'https://www.navienty.com/privacy-policy',
  },
}

const dataGroups = [
  {
    title: 'بيانات التواصل والتوصيل',
    items: [
      'الاسم.',
      'رقم الهاتف.',
      'عنوان التوصيل والعلامات المميزة التي يضيفها المستخدم.',
    ],
  },
  {
    title: 'الموقع',
    items: [
      'إحداثيات الموقع الدقيقة التي يحددها المستخدم لتوصيل الطلب والتحقق من توفر الخدمة في منطقته.',
    ],
  },
  {
    title: 'بيانات الطلب والدفع',
    items: [
      'تفاصيل الطلب والمنتجات والكميات والقيمة والحالة وسجل الطلبات.',
      'طريقة الدفع التي يختارها المستخدم.',
      'لا نخزن كلمات مرور المحافظ أو بيانات البطاقات البنكية أو بيانات الدخول إلى الحسابات المالية.',
    ],
  },
  {
    title: 'المحتوى الذي يقدمه المستخدم',
    items: [
      'ملاحظات الطلب.',
      'وصف الطلبات المرسلة من خلال خدمة «اطلب أي حاجة».',
      'أي تفاصيل إضافية يكتبها المستخدم لإتمام الطلب أو التوصيل.',
    ],
  },
  {
    title: 'المعرّفات والإشعارات',
    items: [
      'معرّف مستخدم داخلي، وقد يكون حسابًا مجهولًا، لربط المستخدم بطلباته وبياناته.',
      'رمز إشعارات الجهاز لإرسال تحديثات الطلب والإشعارات التشغيلية.',
      'لا نستخدم معرّف الإعلانات بغرض التتبع الإعلاني.',
    ],
  },
  {
    title: 'بيانات التفاعل',
    items: [
      'تفاعلات المستخدم مع الأقسام والمنتجات والميزات داخل التطبيق.',
      'تُستخدم هذه البيانات لقياس أداء الميزات وتحسين الاقتراحات وتجربة الاستخدام.',
    ],
  },
]

const uses = [
  'إنشاء الطلبات وتأكيدها وإدارتها وتوصيلها.',
  'التحقق من توفر الخدمة في موقع التوصيل.',
  'عرض سجل الطلبات وحالاتها للمستخدم.',
  'التواصل مع المستخدم بخصوص الطلب أو الدعم.',
  'إرسال إشعارات تشغيلية متعلقة بالطلبات والخدمة.',
  'تقديم اقتراحات ومحتوى أكثر ملاءمة داخل التطبيق.',
  'قياس استخدام الميزات وتحسين الأداء وتجربة المستخدم.',
  'حماية الخدمة ومنع إساءة الاستخدام والاحتيال والمشكلات الأمنية.',
  'الامتثال للالتزامات القانونية والتنظيمية عند انطباقها.',
]

const sharingCases = [
  {
    title: 'المتاجر ومقدمو الخدمة والتوصيل',
    text: 'نشارك فقط البيانات اللازمة لتجهيز الطلب وتسليمه، مثل محتوى الطلب والاسم ورقم الهاتف وعنوان وموقع التوصيل.',
  },
  {
    title: 'Supabase',
    text: 'نستخدم Supabase لخدمات المصادقة وقواعد البيانات والتخزين وتشغيل أجزاء من البنية الخلفية للتطبيق.',
  },
  {
    title: 'Expo وخدمات الإشعارات',
    text: 'قد نستخدم خدمات Expo لمعالجة رموز الإشعارات وإرسال الإشعارات التشغيلية إلى جهاز المستخدم.',
  },
  {
    title: 'WhatsApp',
    text: 'عندما يختار المستخدم متابعة تأكيد الطلب عبر WhatsApp، ينتقل إلى تطبيق أو موقع WhatsApp برسالة جاهزة. يخضع استخدام WhatsApp لسياسة الخصوصية الخاصة به.',
  },
  {
    title: 'الالتزامات القانونية',
    text: 'قد نفصح عن البيانات إذا كان ذلك مطلوبًا بموجب القانون أو لحماية المستخدمين وحقوق Navienty وسلامة الخدمة.',
  },
]

const rights = [
  'طلب معرفة البيانات المرتبطة بك.',
  'طلب تصحيح البيانات غير الدقيقة.',
  'طلب حذف الحساب والبيانات المرتبطة به، مع مراعاة أي التزامات قانونية للاحتفاظ ببعض السجلات.',
  'إيقاف إشعارات التطبيق من إعدادات الجهاز.',
  'إلغاء إذن الموقع من إعدادات الجهاز، مع العلم أن ذلك قد يمنع إتمام طلبات التوصيل.',
]

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    margin: 0,
    background:
      'linear-gradient(180deg, #F3FBF6 0%, #FFFFFF 32%, #F7F9F8 100%)',
    color: '#14231A',
    fontFamily: 'Tahoma, Arial, sans-serif',
  },
  container: {
    width: 'calc(100% - 32px)',
    maxWidth: 980,
    margin: '0 auto',
    padding: '32px 0 72px',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    color: '#00A94F',
    fontSize: 22,
    fontWeight: 800,
    textDecoration: 'none',
  },
  brandMark: {
    width: 38,
    height: 38,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    background: '#00B14F',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 900,
  },
  backLink: {
    color: '#15653A',
    fontWeight: 700,
    textDecoration: 'none',
  },
  hero: {
    padding: 'clamp(24px, 5vw, 48px)',
    borderRadius: 28,
    background: 'linear-gradient(135deg, #00B14F 0%, #008F41 100%)',
    color: '#FFFFFF',
    boxShadow: '0 22px 55px rgba(0, 177, 79, 0.18)',
    marginBottom: 24,
  },
  eyebrow: {
    margin: '0 0 10px',
    fontSize: 14,
    fontWeight: 800,
    opacity: 0.88,
  },
  title: {
    margin: '0 0 14px',
    fontSize: 'clamp(32px, 7vw, 52px)',
    lineHeight: 1.18,
    letterSpacing: '-0.03em',
  },
  heroText: {
    maxWidth: 760,
    margin: 0,
    fontSize: 17,
    lineHeight: 1.9,
    opacity: 0.96,
  },
  updateBadge: {
    display: 'inline-block',
    marginTop: 20,
    padding: '9px 14px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.28)',
    fontSize: 13,
    fontWeight: 700,
  },
  card: {
    padding: 'clamp(22px, 4vw, 34px)',
    marginBottom: 18,
    borderRadius: 22,
    background: '#FFFFFF',
    border: '1px solid #E2ECE6',
    boxShadow: '0 12px 34px rgba(20, 35, 26, 0.05)',
  },
  sectionTitle: {
    margin: '0 0 14px',
    color: '#0B5E32',
    fontSize: 24,
    lineHeight: 1.4,
  },
  paragraph: {
    margin: '0 0 12px',
    color: '#435249',
    fontSize: 16,
    lineHeight: 1.95,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 14,
    marginTop: 18,
  },
  dataCard: {
    padding: 20,
    borderRadius: 18,
    background: '#F5FAF7',
    border: '1px solid #DCECE2',
  },
  dataTitle: {
    margin: '0 0 10px',
    color: '#173E29',
    fontSize: 17,
  },
  list: {
    margin: 0,
    paddingRight: 22,
    color: '#46564C',
    lineHeight: 1.95,
  },
  partnerCard: {
    padding: '16px 0',
    borderBottom: '1px solid #E7EEE9',
  },
  partnerTitle: {
    margin: '0 0 5px',
    color: '#173E29',
    fontSize: 16,
  },
  partnerText: {
    margin: 0,
    color: '#4D5C53',
    lineHeight: 1.85,
  },
  notice: {
    padding: 20,
    borderRadius: 18,
    background: '#EAF8F0',
    border: '1px solid #BFE6CF',
    color: '#174B2D',
    lineHeight: 1.9,
  },
  contactBox: {
    display: 'grid',
    gap: 10,
    padding: 22,
    borderRadius: 18,
    background: '#102C1D',
    color: '#FFFFFF',
  },
  contactLink: {
    color: '#7EF0AE',
    fontWeight: 800,
    textDecoration: 'none',
    wordBreak: 'break-word',
  },
  details: {
    marginTop: 18,
    padding: 20,
    borderRadius: 18,
    border: '1px solid #DCE8E0',
    background: '#FAFCFB',
  },
  summary: {
    cursor: 'pointer',
    color: '#0B5E32',
    fontWeight: 800,
  },
  footer: {
    paddingTop: 24,
    textAlign: 'center',
    color: '#718078',
    fontSize: 13,
  },
}

export default function PrivacyPolicyPage() {
  return (
    <main dir="rtl" style={styles.page}>
      <div style={styles.container}>
        <nav style={styles.topBar}>
          <Link href="/" style={styles.brand}>
            <span style={styles.brandMark}>NOW</span>
            <span>Navienty Now</span>
          </Link>

          <Link href="/" style={styles.backLink}>
            العودة إلى الرئيسية
          </Link>
        </nav>

        <header style={styles.hero}>
          <p style={styles.eyebrow}>الخصوصية والأمان</p>
          <h1 style={styles.title}>سياسة الخصوصية</h1>
          <p style={styles.heroText}>
            توضح هذه السياسة كيفية جمع واستخدام وحماية البيانات عند استخدام
            تطبيق وخدمات Navienty Now. باستخدام الخدمة، فإنك تقر بأنك قرأت هذه
            السياسة وفهمتها.
          </p>
          <span style={styles.updateBadge}>آخر تحديث: 30 أغسطس 2026</span>
        </header>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>1. نطاق السياسة</h2>
          <p style={styles.paragraph}>
            تنطبق هذه السياسة على تطبيق Navienty Now وخدمات الطلب والتوصيل
            والميزات المرتبطة به. تدير Navienty هذه الخدمة من مصر، ويمكن التواصل
            معنا باستخدام البيانات الموجودة في نهاية هذه الصفحة.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>2. البيانات التي نجمعها</h2>
          <p style={styles.paragraph}>
            نجمع البيانات اللازمة لتشغيل الخدمة وإتمام الطلبات وتحسين تجربة
            الاستخدام. قد تشمل البيانات الفئات التالية:
          </p>
          <div style={styles.grid}>
            {dataGroups.map((group) => (
              <div key={group.title} style={styles.dataCard}>
                <h3 style={styles.dataTitle}>{group.title}</h3>
                <ul style={styles.list}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>3. كيفية استخدام البيانات</h2>
          <ul style={styles.list}>
            {uses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>4. مشاركة البيانات</h2>
          <p style={styles.paragraph}>
            لا نبيع البيانات الشخصية. وقد نشارك القدر الضروري منها فقط في
            الحالات التالية:
          </p>
          {sharingCases.map((item) => (
            <div key={item.title} style={styles.partnerCard}>
              <h3 style={styles.partnerTitle}>{item.title}</h3>
              <p style={styles.partnerText}>{item.text}</p>
            </div>
          ))}
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>5. الإعلانات والتتبع</h2>
          <div style={styles.notice}>
            لا تستخدم Navienty Now البيانات الشخصية أو الموقع أو المعرّفات أو
            سجل الطلبات لتتبع المستخدم عبر تطبيقات ومواقع شركات أخرى، ولا نشارك
            البيانات مع وسطاء بيانات أو شبكات إعلانية بغرض الإعلانات الموجهة.
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>6. الاحتفاظ بالبيانات</h2>
          <p style={styles.paragraph}>
            نحتفظ بالبيانات طالما كانت ضرورية لتقديم الخدمة وإدارة الطلبات وحل
            النزاعات ومنع الاحتيال والامتثال للمتطلبات القانونية والمحاسبية. وقد
            نحتفظ ببعض سجلات المعاملات بعد حذف الحساب عندما يفرض القانون ذلك.
          </p>
          <p style={styles.paragraph}>
            يُحذف أو يُعطّل رمز إشعارات الجهاز عندما يصبح غير صالح أو عند حذف
            الحساب أو عندما لا يعود مطلوبًا لتقديم الخدمة.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>7. حماية البيانات</h2>
          <p style={styles.paragraph}>
            نطبق إجراءات تقنية وتنظيمية مناسبة لحماية البيانات من الوصول أو
            الاستخدام أو التعديل أو الإفصاح غير المصرح به. ومع ذلك، لا توجد
            وسيلة نقل أو تخزين إلكتروني آمنة بنسبة مطلقة.
          </p>
        </section>

        <section id="privacy-rights" style={styles.card}>
          <h2 style={styles.sectionTitle}>8. حقوق واختيارات المستخدم</h2>
          <p style={styles.paragraph}>
            يمكن للمستخدم التواصل معنا لممارسة الحقوق التالية:
          </p>
          <ul style={styles.list}>
            {rights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p style={{ ...styles.paragraph, marginTop: 16 }}>
            يمكن إرسال الطلب من داخل التطبيق إذا كانت الخاصية متاحة، أو عبر
            البريد الإلكتروني الموضح أدناه. وقد نطلب معلومات معقولة للتحقق من
            هوية صاحب الطلب.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>9. خدمات الأطراف الأخرى</h2>
          <p style={styles.paragraph}>
            قد يحتوي التطبيق على روابط أو انتقالات إلى خدمات أخرى مثل WhatsApp.
            لا تتحكم Navienty في ممارسات الخصوصية الخاصة بهذه الخدمات، ويُنصح
            بمراجعة سياساتها قبل استخدامها.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>10. خصوصية الأطفال</h2>
          <p style={styles.paragraph}>
            الخدمة غير موجهة للأطفال دون سن 13 عامًا، ولا نتعمد جمع بياناتهم دون
            موافقة ولي الأمر عندما تكون هذه الموافقة مطلوبة قانونًا. إذا اعتقدت
            أن طفلًا قدم بياناته دون تصريح، فتواصل معنا لطلب مراجعتها وحذفها.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>11. تحديثات السياسة</h2>
          <p style={styles.paragraph}>
            قد نحدّث هذه السياسة عند تغيير الخدمة أو المتطلبات القانونية. سننشر
            النسخة المحدثة على هذه الصفحة مع تعديل تاريخ آخر تحديث، وقد نعرض
            إشعارًا داخل التطبيق عند وجود تغيير جوهري.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>12. التواصل معنا</h2>
          <div style={styles.contactBox}>
            <strong>Navienty</strong>
            <span>
              البريد الإلكتروني:{' '}
              <a
                href="mailto:contact@navienty.com"
                style={styles.contactLink}
              >
                contact@navienty.com
              </a>
            </span>
            <span>
              الهاتف:{' '}
              <a
                href="tel:+201018668663"
                style={styles.contactLink}
                dir="ltr"
              >
                +20 101 866 8663
              </a>
            </span>
            <span>
              صفحة التواصل:{' '}
              <a
                href="https://www.navienty.com/contact"
                style={styles.contactLink}
              >
                navienty.com/contact
              </a>
            </span>
          </div>

          <details style={styles.details}>
            <summary style={styles.summary}>English Privacy Summary</summary>
            <div
              dir="ltr"
              style={{ marginTop: 16, color: '#46564C', lineHeight: 1.85 }}
            >
              <p>
                Navienty Now collects the information required to create,
                manage, and deliver orders. This may include name, phone
                number, delivery address, precise delivery location, selected
                payment method, order history, user notes, an internal user ID,
                a push notification token, and product interaction data.
              </p>
              <p>
                We use this information for app functionality, service
                availability, order notifications, analytics, security, and
                personalized in-app recommendations. We do not sell personal
                data and do not use it for cross-app tracking or targeted
                advertising.
              </p>
              <p>
                Necessary information may be shared with stores, delivery
                providers, Supabase, Expo, WhatsApp when selected by the user,
                and authorities when legally required.
              </p>
              <p>
                Users may request access, correction, or deletion by contacting
                contact@navienty.com.
              </p>
            </div>
          </details>
        </section>

        <footer style={styles.footer}>
          © 2026 Navienty. جميع الحقوق محفوظة.
        </footer>
      </div>
    </main>
  )
}
