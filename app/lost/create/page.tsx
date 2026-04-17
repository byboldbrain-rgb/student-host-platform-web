import Link from 'next/link'
import Script from 'next/script'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '../../../src/lib/supabase/server'
import LanguageDropdown from '../../properties/LanguageDropdown'
import {
  CareerAnimatedIcon,
  HomesAnimatedIcon,
  ServicesAnimatedIcon,
} from '../../properties/AnimatedTopNavIcons'

type SearchParams = {
  lang?: string
}

type SupportedLanguage = 'en' | 'ar'

type City = {
  id: string | number
  name_en: string
  name_ar: string
}

type University = {
  id: string | number
  name_en: string
  name_ar: string
  city_id: string | number
}

const LOST_ICON_JSON = `{"v":"5.12.1","fr":60,"ip":0,"op":90,"w":430,"h":430,"nm":"wired-outline-19-magnifier-zoom-search","ddd":0,"assets":[{"id":"comp_1","nm":"hover-spin","fr":60,"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"Warstwa 7","parent":3,"sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[0.89,0.89,0],"ix":2,"l":2},"a":{"a":0,"k":[-8.526,-8.465,0],"ix":1,"l":2},"s":{"a":0,"k":[100,100,100],"ix":6,"l":2}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[-45.944,-45.944],[45.944,-45.944],[45.944,45.944],[-45.944,45.944]],"o":[[45.944,45.944],[-45.944,45.944],[-45.944,-45.944],[45.944,-45.944]],"v":[[74.408,-91.908],[74.408,74.47],[-91.97,74.47],[-91.97,-91.908]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"t":20,"s":[0]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":55,"s":[51]},{"t":90,"s":[51.5]}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[14]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"t":20,"s":[66]},{"t":90,"s":[65.8]}],"ix":2},"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[-113]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"t":20,"s":[247]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":55,"s":[1156]},{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":70.33,"s":[1133]},{"t":90,"s":[1141.2]}],"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false},{"ty":"st","c":{"a":0,"k":[0.933,0.561,0.4,1],"ix":3,"x":"var $bm_rt;\\n$bm_rt = comp('wired-outline-19-magnifier-zoom-search').layer('control').effect('secondary')('Color');"},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":18,"ix":5,"x":"var $bm_rt;\\n$bm_rt = $bm_mul($bm_div(value, 3), comp('wired-outline-19-magnifier-zoom-search').layer('control').effect('stroke')('Menu'));"},"lc":2,"lj":2,"bm":0,"nm":".secondary","mn":"ADBE Vector Graphic - Stroke","hd":false,"cl":"secondary"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 2","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"tm","s":{"a":0,"k":0,"ix":1},"e":{"a":0,"k":100,"ix":2},"o":{"a":0,"k":0,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false}],"ip":0,"op":300,"st":0,"ct":1,"bm":0},{"ddd":0,"ind":2,"ty":4,"nm":"Line 16","parent":3,"sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[142.253,143.25,0],"ix":2,"l":2},"a":{"a":0,"k":[0,0,0],"ix":1,"l":2},"s":{"a":0,"k":[100,100,100],"ix":6,"l":2}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[56.922,0],[-56.922,0]],"c":false},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"tm","s":{"a":0,"k":0,"ix":1},"e":{"a":0,"k":100,"ix":2},"o":{"a":0,"k":0,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false},{"ty":"st","c":{"a":0,"k":[0.188,0.502,0.91,1],"ix":3,"x":"var $bm_rt;\\n$bm_rt = comp('wired-outline-19-magnifier-zoom-search').layer('control').effect('primary')('Color');"},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":18,"ix":5,"x":"var $bm_rt;\\n$bm_rt = $bm_mul($bm_div(value, 3), comp('wired-outline-19-magnifier-zoom-search').layer('control').effect('stroke')('Menu'));"},"lc":2,"lj":1,"ml":4,"bm":0,"nm":".primary","mn":"ADBE Vector Graphic - Stroke","hd":false,"cl":"primary"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":45,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Line 16","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"ct":1,"bm":0},{"ddd":0,"ind":3,"ty":4,"nm":"Ellipse 2","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.42],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":27,"s":[13]},{"t":90,"s":[0]}],"ix":10},"p":{"a":1,"k":[{"i":{"x":0.667,"y":1},"o":{"x":0.333,"y":0},"t":0,"s":[192.497,191.5,0],"to":[0,0,0],"ti":[0,0,0]},{"i":{"x":0.42,"y":1},"o":{"x":0.333,"y":0},"t":27,"s":[224.497,191.5,0],"to":[0,0,0],"ti":[0,0,0]},{"t":90,"s":[192.497,191.5,0]}],"ix":2,"l":2},"a":{"a":0,"k":[0,0,0],"ix":1,"l":2},"s":{"a":0,"k":[100,100,100],"ix":6,"l":2}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[-80.081,0],[0,-80.081],[80.081,0],[0,80.081]],"o":[[80.081,0],[0,80.081],[-80.081,0],[0,-80.081]],"v":[[0,-145],[145,0],[0,145],[-145,0]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"st","c":{"a":0,"k":[0.188,0.502,0.91,1],"ix":3,"x":"var $bm_rt;\\n$bm_rt = comp('wired-outline-19-magnifier-zoom-search').layer('control').effect('primary')('Color');"},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":18,"ix":5,"x":"var $bm_rt;\\n$bm_rt = $bm_mul($bm_div(value, 3), comp('wired-outline-19-magnifier-zoom-search').layer('control').effect('stroke')('Menu'));"},"lc":1,"lj":1,"ml":4,"bm":0,"nm":".primary","mn":"ADBE Vector Graphic - Stroke","hd":false,"cl":"primary"},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Ellipse 2","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"ct":1,"bm":0}]}],"layers":[{"ddd":0,"ind":1,"ty":3,"nm":"control","sr":1,"ks":{"o":{"a":0,"k":0,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[0,0],"ix":2,"l":2},"a":{"a":0,"k":[0,0,0],"ix":1,"l":2},"s":{"a":0,"k":[100,100,100],"ix":6,"l":2}},"ao":0,"ef":[{"ty":5,"nm":"stroke","np":3,"mn":"Pseudo/@@xqaT0VilSnytn6+/jSMi+Q","ix":1,"en":1,"ef":[{"ty":7,"nm":"Menu","mn":"Pseudo/@@xqaT0VilSnytn6+/jSMi+Q-0001","ix":1,"v":{"a":0,"k":3,"ix":1}}]},{"ty":5,"nm":"primary","np":3,"mn":"ADBE Color Control","ix":2,"en":1,"ef":[{"ty":2,"nm":"Color","mn":"ADBE Color Control-0001","ix":1,"v":{"a":0,"k":[0.188,0.502,0.91],"ix":1}}]},{"ty":5,"nm":"secondary","np":3,"mn":"ADBE Color Control","ix":3,"en":1,"ef":[{"ty":2,"nm":"Color","mn":"ADBE Color Control-0001","ix":1,"v":{"a":0,"k":[0.933,0.561,0.4],"ix":1}}]}],"ip":0,"op":701,"st":0,"bm":0},{"ddd":0,"ind":3,"ty":0,"nm":"hover-spin","refId":"comp_1","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[215,215,0],"ix":2,"l":2},"a":{"a":0,"k":[215,215,0],"ix":1,"l":2},"s":{"a":0,"k":[100,100,100],"ix":6,"l":2}},"ao":0,"w":430,"h":430,"ip":0,"op":100,"st":0,"bm":0}],"markers":[{"tm":0,"cm":"default:hover-spin","dr":90}],"props":{}}`

const TRANSLATIONS = {
  en: {
    homes: 'Homes',
    services: 'Services',
    career: 'Career',
    lost: 'Lost',
    language: 'Language',
    pageTitle: 'Post found item',
    pageDescription:
      'Add the details of the item you found so its owner can reach it faster.',
    backToLost: 'Back to lost items',
    itemTitle: 'Item title',
    governorate: 'Governorate',
    university: 'University',
    faculty: 'Faculty',
    category: 'Category',
    foundLocation: 'Found location',
    foundDate: 'Found date',
    description: 'Description',
    imageUpload: 'Upload image',
    holderName: 'Your name',
    holderPhone: 'Phone number',
    holderEmail: 'Email',
    optional: 'Optional',
    selectGovernorate: 'Select governorate',
    selectUniversity: 'Select university',
    selectFaculty: 'Select faculty',
    titlePlaceholder: 'Example: Black wallet',
    categoryPlaceholder: 'Example: Wallet, phone, bag...',
    locationPlaceholder: 'Example: Main gate',
    descriptionPlaceholder: 'Write any details that help identify the item.',
    holderNamePlaceholder: 'Your full name',
    holderPhonePlaceholder: '01xxxxxxxxx',
    holderEmailPlaceholder: 'name@example.com',
    imageHint: 'Choose an image from your phone or camera.',
    submit: 'Publish item',
    infoBoxTitle: 'Before publishing',
    infoBoxText:
      'Make sure the title, place, and contact details are correct.',
  },
  ar: {
    homes: 'المنازل',
    services: 'الخدمات',
    career: 'الوظائف',
    lost: 'المفقودات',
    language: 'اللغة',
    pageTitle: 'أضف شيء تم العثور عليه',
    pageDescription:
      'اكتب بيانات الشيء الذي وجدته حتى يتمكن صاحبه من الوصول إليه بسرعة.',
    backToLost: 'الرجوع إلى المفقودات',
    itemTitle: 'عنوان الشيء',
    governorate: 'المحافظة',
    university: 'الجامعة',
    faculty: 'الكلية',
    category: 'التصنيف',
    foundLocation: 'مكان العثور',
    foundDate: 'تاريخ العثور',
    description: 'الوصف',
    imageUpload: 'رفع صورة',
    holderName: 'اسمك',
    holderPhone: 'رقم الهاتف',
    holderEmail: 'البريد الإلكتروني',
    optional: 'اختياري',
    selectGovernorate: 'اختر المحافظة',
    selectUniversity: 'اختر الجامعة',
    selectFaculty: 'اختر الكلية',
    titlePlaceholder: 'مثال: محفظة سوداء',
    categoryPlaceholder: 'مثال: محفظة، هاتف، شنطة...',
    locationPlaceholder: 'مثال: البوابة الرئيسية',
    descriptionPlaceholder: 'اكتب أي تفاصيل تساعد على التعرف على الشيء.',
    holderNamePlaceholder: 'اكتب اسمك بالكامل',
    holderPhonePlaceholder: '01xxxxxxxxx',
    holderEmailPlaceholder: 'name@example.com',
    imageHint: 'اختر صورة من الهاتف أو الكاميرا.',
    submit: 'نشر العنصر',
    infoBoxTitle: 'قبل النشر',
    infoBoxText: 'تأكد أن العنوان والمكان ووسيلة التواصل مكتوبين بشكل صحيح.',
  },
} as const

function normalizeLanguage(value?: string): SupportedLanguage {
  return value === 'ar' ? 'ar' : 'en'
}

function LostNavIcon({
  className = '',
}: {
  className?: string
}) {
  const iconDataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
    LOST_ICON_JSON
  )}`

  return (
    <span
      className={`flex items-center justify-center ${className || 'h-[54px] w-[54px]'}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: `
          <lord-icon
            src="${iconDataUri}"
            trigger="hover"
            style="width:100%;height:100%;display:block;">
          </lord-icon>
        `,
      }}
    />
  )
}

export default async function CreateLostItemPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const selectedLanguage = normalizeLanguage(params.lang)
  const t = TRANSLATIONS[selectedLanguage]
  const isArabic = selectedLanguage === 'ar'

  const supabase = await createClient()

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name_en, name_ar')
    .order('name_en', { ascending: true })

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name_en, name_ar, city_id')
    .order('name_en', { ascending: true })

  const { data: facultiesSource } = await supabase
    .from('lost_items')
    .select('faculty')
    .not('faculty', 'is', null)

  const faculties = Array.from(
    new Set(
      ((facultiesSource as { faculty: string | null }[]) ?? [])
        .map((item) => item.faculty?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b))

  async function createLostItem(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const lang = normalizeLanguage(String(formData.get('lang') || 'en'))

    const title = String(formData.get('title') || '').trim()
    const governorate = String(formData.get('governorate') || '').trim()
    const university = String(formData.get('university') || '').trim()
    const faculty = String(formData.get('faculty') || '').trim()
    const category = String(formData.get('category') || '').trim()
    const found_location = String(formData.get('found_location') || '').trim()
    const found_date = String(formData.get('found_date') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const holder_name = String(formData.get('holder_name') || '').trim()
    const holder_phone = String(formData.get('holder_phone') || '').trim()
    const holder_email = String(formData.get('holder_email') || '').trim()

    const imageFile = formData.get('image_file') as File | null

    if (!title || !governorate || !university || !holder_name) {
      redirect(`/lost/create?lang=${lang}`)
    }

    let image_url: string | null = null

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)
        ? fileExt
        : 'jpg'

      const fileName = `lost-items/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${safeExt}`

      const { error: uploadError } = await supabase.storage
        .from('lost-items')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type || `image/${safeExt}`,
        })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('lost-items')
          .getPublicUrl(fileName)

        image_url = publicUrlData.publicUrl
      }
    }

    await supabase.from('lost_items').insert({
      title,
      governorate,
      university,
      faculty: faculty || null,
      category: category || null,
      found_location: found_location || null,
      found_date: found_date || null,
      description: description || null,
      image_url,
      holder_name,
      holder_phone: holder_phone || null,
      holder_email: holder_email || null,
      status: 'available',
    })

    redirect(`/lost?lang=${lang}`)
  }

  const buildSimpleNavLink = (path: string) => {
    const p = new URLSearchParams()
    p.set('lang', selectedLanguage)
    return `${path}?${p.toString()}`
  }

  const buildLostLink = () => {
    const p = new URLSearchParams()
    p.set('lang', selectedLanguage)
    return `/lost?${p.toString()}`
  }

  const menuButtonClass =
    'flex h-12 min-w-12 items-center justify-center rounded-full border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 shadow-sm transition hover:border-black'

  const menuPanelClass = isArabic
    ? 'absolute left-0 top-[calc(100%+10px)] z-40 min-w-[240px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]'
    : 'absolute right-0 top-[calc(100%+10px)] z-40 min-w-[240px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.14)]'

  const menuLinkClass =
    'block px-4 py-3 text-sm text-gray-800 transition hover:bg-gray-50'

  const renderTopNavItem = ({
    href,
    label,
    icon,
    isActive = false,
    isMobile = false,
  }: {
    href: string
    label: string
    icon: ReactNode
    isActive?: boolean
    isMobile?: boolean
  }) => (
    <Link
      href={href}
      className={`group relative flex items-center transition shrink-0 ${
        isMobile ? 'flex-col pb-3 px-1' : 'flex-row gap-2 px-3 pt-2 pb-1'
      } ${isActive ? 'text-[#222222]' : 'text-[#6A6A6A] hover:text-[#222222]'}`}
    >
      <span className="flex shrink-0 items-center justify-center">{icon}</span>

      <span
        className={`font-sans font-semibold tracking-tight leading-none ${
          isActive ? 'text-[#222222]' : 'text-inherit'
        } ${isMobile ? 'text-[14px]' : 'text-[18px]'}`}
      >
        {label}
      </span>

      {!isMobile && isActive && (
        <div className="absolute -bottom-[2px] left-0 right-0 h-[3px] rounded-full bg-[#222222]" />
      )}

      {isMobile && isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] w-full bg-black" />
      )}
    </Link>
  )

  const governorateOptions = (cities as City[]) ?? []
  const universityOptions = (universities as University[]) ?? []

  return (
    <>
      <Script
        src="https://cdn.lordicon.com/lordicon.js"
        strategy="afterInteractive"
      />

      <main
        dir={isArabic ? 'rtl' : 'ltr'}
        className="relative min-h-screen bg-white pb-20 text-gray-700 md:pb-0"
      >
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm md:static md:bg-[#f7f7f7] md:shadow-none">
          <div className="w-full bg-white pb-1 pt-1 md:hidden">
            <div className="flex items-center justify-start gap-6 overflow-x-auto px-4 hide-scrollbar">
              {renderTopNavItem({
                href: buildSimpleNavLink('/properties'),
                label: t.homes,
                icon: <HomesAnimatedIcon size={28} className="h-20 w-20" />,
                isMobile: true,
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink('/services'),
                label: t.services,
                icon: <ServicesAnimatedIcon size={28} className="h-20 w-20" />,
                isMobile: true,
              })}

              {renderTopNavItem({
                href: buildSimpleNavLink('/career'),
                label: t.career,
                icon: <CareerAnimatedIcon size={28} className="h-20 w-20" />,
                isMobile: true,
              })}

              {renderTopNavItem({
                href: buildLostLink(),
                label: t.lost,
                icon: <LostNavIcon className="h-13 w-13" />,
                isActive: true,
                isMobile: true,
              })}
            </div>
          </div>

          <div className="mx-auto hidden max-w-[1920px] px-6 md:block">
            <div className="flex items-center justify-between pt-0">
              <Link
                href={buildSimpleNavLink('/properties')}
                className="flex items-center"
              >
                <img
                  src="https://i.ibb.co/5Xkcn6Fr/g.png"
                  alt="Logo"
                  style={{ width: '140px', height: 'auto', marginTop: '-15px' }}
                />
              </Link>

              <div className="flex items-center justify-center gap-5 xl:gap-8">
                {renderTopNavItem({
                  href: buildSimpleNavLink('/properties'),
                  label: t.homes,
                  icon: (
                    <HomesAnimatedIcon size={70} className="h-[70px] w-[70px]" />
                  ),
                })}

                {renderTopNavItem({
                  href: buildSimpleNavLink('/services'),
                  label: t.services,
                  icon: (
                    <ServicesAnimatedIcon
                      size={70}
                      className="h-[70px] w-[70px]"
                    />
                  ),
                })}

                {renderTopNavItem({
                  href: buildSimpleNavLink('/career'),
                  label: t.career,
                  icon: (
                    <CareerAnimatedIcon size={70} className="h-[70px] w-[70px]" />
                  ),
                })}

                {renderTopNavItem({
                  href: buildLostLink(),
                  label: t.lost,
                  icon: <LostNavIcon className="h-[40px] w-[40px]" />,
                  isActive: true,
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

        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <div className="mb-6">
            <Link
              href={buildLostLink()}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:border-black"
            >
              <span className="rtl:rotate-180">←</span>
              {t.backToLost}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="rounded-[28px] border border-gray-200 bg-[#fafafa] p-6 shadow-sm">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <span className="text-2xl">🔎</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                {t.pageTitle}
              </h1>

              <p className="mt-3 text-sm leading-7 text-gray-600 md:text-base">
                {t.pageDescription}
              </p>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  {t.infoBoxTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {t.infoBoxText}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-7">
              <form action={createLostItem} className="space-y-5">
                <input type="hidden" name="lang" value={selectedLanguage} />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    {t.itemTitle} <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="title"
                    required
                    placeholder={t.titlePlaceholder}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      {t.governorate} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="governorate"
                      required
                      defaultValue=""
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                    >
                      <option value="" disabled>
                        {t.selectGovernorate}
                      </option>
                      {governorateOptions.map((city) => (
                        <option
                          key={city.id}
                          value={isArabic ? city.name_ar : city.name_en}
                        >
                          {isArabic ? city.name_ar : city.name_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      {t.university} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="university"
                      required
                      defaultValue=""
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                    >
                      <option value="" disabled>
                        {t.selectUniversity}
                      </option>
                      {universityOptions.map((university) => (
                        <option
                          key={university.id}
                          value={isArabic ? university.name_ar : university.name_en}
                        >
                          {isArabic ? university.name_ar : university.name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      {t.faculty}{' '}
                      <span className="text-xs font-medium text-gray-500">
                        ({t.optional})
                      </span>
                    </label>
                    <input
                      name="faculty"
                      list="faculties-list"
                      placeholder={t.selectFaculty}
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                    />
                    <datalist id="faculties-list">
                      {faculties.map((faculty) => (
                        <option key={faculty} value={faculty} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      {t.category}{' '}
                      <span className="text-xs font-medium text-gray-500">
                        ({t.optional})
                      </span>
                    </label>
                    <input
                      name="category"
                      placeholder={t.categoryPlaceholder}
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      {t.foundLocation}{' '}
                      <span className="text-xs font-medium text-gray-500">
                        ({t.optional})
                      </span>
                    </label>
                    <input
                      name="found_location"
                      placeholder={t.locationPlaceholder}
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      {t.foundDate}{' '}
                      <span className="text-xs font-medium text-gray-500">
                        ({t.optional})
                      </span>
                    </label>
                    <input
                      name="found_date"
                      type="date"
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    {t.description}{' '}
                    <span className="text-xs font-medium text-gray-500">
                      ({t.optional})
                    </span>
                  </label>
                  <textarea
                    name="description"
                    rows={5}
                    placeholder={t.descriptionPlaceholder}
                    className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    {t.imageUpload}{' '}
                    <span className="text-xs font-medium text-gray-500">
                      ({t.optional})
                    </span>
                  </label>

                  <input
                    name="image_file"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="block w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 file:me-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />

                  <p className="mt-2 text-xs text-gray-500">{t.imageHint}</p>
                </div>

                <div className="border-t border-gray-200 pt-5">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {t.holderName}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-900">
                        {t.holderName} <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="holder_name"
                        required
                        placeholder={t.holderNamePlaceholder}
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-900">
                        {t.holderPhone}{' '}
                        <span className="text-xs font-medium text-gray-500">
                          ({t.optional})
                        </span>
                      </label>
                      <input
                        name="holder_phone"
                        placeholder={t.holderPhonePlaceholder}
                        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      {t.holderEmail}{' '}
                      <span className="text-xs font-medium text-gray-500">
                        ({t.optional})
                      </span>
                    </label>
                    <input
                      name="holder_email"
                      type="email"
                      placeholder={t.holderEmailPlaceholder}
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#222222] md:w-auto md:min-w-[220px]"
                  >
                    {t.submit}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <footer className="mt-8 bg-gray-100 py-6">
          <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4">
            <p className="text-sm text-gray-600">© 2026 Baytgo, Inc.</p>

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
      </main>
    </>
  )
}