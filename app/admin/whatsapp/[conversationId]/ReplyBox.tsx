'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChangeEvent, FormEvent, useMemo, useRef, useState, useTransition } from 'react'
import {
  sendWhatsAppContactReplyAction,
  sendWhatsAppMediaReplyAction,
  sendWhatsAppReplyAction,
} from './actions'

type ReplyTarget = {
  id: string
  direction: 'inbound' | 'outbound'
  message_type: string
  body: string | null
  media_filename: string | null
}

type ReplyBoxProps = {
  conversationId: string
  conversationType?: string | null
  replyToMessage?: ReplyTarget | null
  cancelReplyHref?: string
}

type QuickReply = {
  label: string
  body: string
}

type ActivePanel = 'attachments' | 'emojis' | 'quickReplies' | null

type EmojiCategoryKey =
  | 'smileys'
  | 'animals'
  | 'food'
  | 'activities'
  | 'travel'
  | 'objects'
  | 'symbols'
  | 'flags'

type EmojiCategory = {
  key: EmojiCategoryKey
  title: string
  icon: string
  emojis: string[]
}

const emojiCategories: EmojiCategory[] = [
  {
    key: 'smileys',
    title: 'Smileys & People',
    icon: '😀',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '🥹',
      '😅',
      '😂',
      '🤣',
      '🥲',
      '😊',
      '☺️',
      '😇',
      '🙂',
      '🙃',
      '😉',
      '😌',
      '😍',
      '🥰',
      '😘',
      '😗',
      '😙',
      '😚',
      '😋',
      '😛',
      '😝',
      '😜',
      '🤪',
      '🤨',
      '🧐',
      '🤓',
      '😎',
      '🥸',
      '🤩',
      '🥳',
      '😏',
      '😒',
      '😞',
      '😔',
      '😟',
      '😕',
      '🙁',
      '☹️',
      '😣',
      '😖',
      '😫',
      '😩',
      '🥺',
      '😢',
      '😭',
      '😮‍💨',
      '😤',
      '😠',
      '😡',
      '🤬',
      '🤯',
      '😳',
      '🥵',
      '🥶',
      '😱',
      '😨',
      '😰',
      '😥',
      '😓',
      '🫣',
      '🤗',
      '🫡',
      '🤔',
      '🫢',
      '🤭',
      '🤫',
      '🤥',
      '😶',
      '😐',
      '😑',
      '😬',
      '🫨',
      '🙄',
      '😯',
      '😦',
      '😧',
      '😮',
      '😲',
      '🥱',
      '😴',
      '🤤',
      '😪',
      '😵',
      '🤐',
      '🥴',
      '🤢',
      '🤮',
      '🤧',
      '😷',
      '🤒',
      '🤕',
      '🤑',
      '🤠',
      '😈',
      '👿',
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🫰',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '🫶',
      '🙏',
    ],
  },
  {
    key: 'animals',
    title: 'Animals & Nature',
    icon: '🐻',
    emojis: [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐸',
      '🐵',
      '🙈',
      '🙉',
      '🙊',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🦆',
      '🦅',
      '🦉',
      '🦇',
      '🐺',
      '🐗',
      '🐴',
      '🦄',
      '🐝',
      '🪱',
      '🐛',
      '🦋',
      '🐌',
      '🐞',
      '🐜',
      '🪰',
      '🪲',
      '🪳',
      '🦟',
      '🦗',
      '🕷️',
      '🦂',
      '🐢',
      '🐍',
      '🦎',
      '🦖',
      '🦕',
      '🐙',
      '🦑',
      '🦐',
      '🦞',
      '🦀',
      '🐡',
      '🐠',
      '🐟',
      '🐬',
      '🐳',
      '🐋',
      '🦈',
      '🐊',
      '🐅',
      '🐆',
      '🦓',
      '🦍',
      '🦧',
      '🐘',
      '🦛',
      '🦏',
      '🐪',
      '🐫',
      '🦒',
      '🦘',
      '🦬',
      '🐃',
      '🐂',
      '🐄',
      '🐎',
      '🐖',
      '🐏',
      '🐑',
      '🦙',
      '🐐',
      '🦌',
      '🌵',
      '🎄',
      '🌲',
      '🌳',
      '🌴',
      '🪴',
      '🌱',
      '🌿',
      '☘️',
      '🍀',
      '🍃',
      '🍂',
      '🍁',
      '🌾',
      '🌺',
      '🌸',
      '🌼',
      '🌻',
      '🌞',
      '🌝',
      '🌛',
      '🌜',
      '🌚',
      '🌕',
      '⭐',
      '🌟',
      '✨',
      '⚡',
      '🔥',
      '🌈',
      '☀️',
      '🌤️',
      '⛅',
      '🌧️',
      '⛈️',
      '🌊',
    ],
  },
  {
    key: 'food',
    title: 'Food & Drink',
    icon: '🍴',
    emojis: [
      '🍏',
      '🍎',
      '🍐',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🫐',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🍆',
      '🥑',
      '🥦',
      '🥬',
      '🥒',
      '🌶️',
      '🫑',
      '🌽',
      '🥕',
      '🫒',
      '🧄',
      '🧅',
      '🥔',
      '🍠',
      '🥐',
      '🥯',
      '🍞',
      '🥖',
      '🥨',
      '🧀',
      '🥚',
      '🍳',
      '🧈',
      '🥞',
      '🧇',
      '🥓',
      '🥩',
      '🍗',
      '🍖',
      '🌭',
      '🍔',
      '🍟',
      '🍕',
      '🫓',
      '🥪',
      '🥙',
      '🧆',
      '🌮',
      '🌯',
      '🫔',
      '🥗',
      '🥘',
      '🫕',
      '🥫',
      '🍝',
      '🍜',
      '🍲',
      '🍛',
      '🍣',
      '🍱',
      '🥟',
      '🦪',
      '🍤',
      '🍙',
      '🍚',
      '🍘',
      '🍥',
      '🥠',
      '🥮',
      '🍢',
      '🍡',
      '🍧',
      '🍨',
      '🍦',
      '🥧',
      '🧁',
      '🍰',
      '🎂',
      '🍮',
      '🍭',
      '🍬',
      '🍫',
      '🍿',
      '🍩',
      '🍪',
      '🌰',
      '🥜',
      '☕',
      '🍵',
      '🧃',
      '🥤',
      '🧋',
      '🍽️',
      '🍴',
      '🥄',
    ],
  },
  {
    key: 'activities',
    title: 'Activities',
    icon: '⚽',
    emojis: [
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🪀',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '🪃',
      '🥅',
      '⛳',
      '🪁',
      '🏹',
      '🎣',
      '🤿',
      '🥊',
      '🥋',
      '🎽',
      '🛹',
      '🛼',
      '🛷',
      '⛸️',
      '🥌',
      '🎿',
      '⛷️',
      '🏂',
      '🪂',
      '🏋️',
      '🤼',
      '🤸',
      '⛹️',
      '🤺',
      '🤾',
      '🏌️',
      '🏇',
      '🧘',
      '🏄',
      '🏊',
      '🤽',
      '🚣',
      '🧗',
      '🚵',
      '🚴',
      '🏆',
      '🥇',
      '🥈',
      '🥉',
      '🏅',
      '🎖️',
      '🏵️',
      '🎗️',
      '🎫',
      '🎟️',
      '🎪',
      '🤹',
      '🎭',
      '🩰',
      '🎨',
      '🎬',
      '🎤',
      '🎧',
      '🎼',
      '🎹',
      '🥁',
      '🪘',
      '🎷',
      '🎺',
      '🪗',
      '🎸',
      '🪕',
      '🎻',
      '🎲',
      '♟️',
      '🎯',
      '🎳',
      '🎮',
      '🎰',
      '🧩',
    ],
  },
  {
    key: 'travel',
    title: 'Travel & Places',
    icon: '🚗',
    emojis: [
      '🚗',
      '🚕',
      '🚙',
      '🚌',
      '🚎',
      '🏎️',
      '🚓',
      '🚑',
      '🚒',
      '🚐',
      '🛻',
      '🚚',
      '🚛',
      '🚜',
      '🦯',
      '🦽',
      '🦼',
      '🛴',
      '🚲',
      '🛵',
      '🏍️',
      '🛺',
      '🚨',
      '🚔',
      '🚍',
      '🚘',
      '🚖',
      '🚡',
      '🚠',
      '🚟',
      '🚃',
      '🚋',
      '🚞',
      '🚝',
      '🚄',
      '🚅',
      '🚈',
      '🚂',
      '🚆',
      '🚇',
      '🚊',
      '🚉',
      '✈️',
      '🛫',
      '🛬',
      '🛩️',
      '💺',
      '🛰️',
      '🚀',
      '🛸',
      '🚁',
      '🛶',
      '⛵',
      '🚤',
      '🛥️',
      '🛳️',
      '⛴️',
      '🚢',
      '⚓',
      '🪝',
      '⛽',
      '🚧',
      '🚦',
      '🚥',
      '🚏',
      '🗺️',
      '🗿',
      '🗽',
      '🗼',
      '🏰',
      '🏯',
      '🏟️',
      '🎡',
      '🎢',
      '🎠',
      '⛲',
      '⛱️',
      '🏖️',
      '🏝️',
      '🏜️',
      '🌋',
      '⛰️',
      '🏔️',
      '🗻',
      '🏕️',
      '⛺',
      '🛖',
      '🏠',
      '🏡',
      '🏘️',
      '🏚️',
      '🏗️',
      '🏢',
      '🏬',
      '🏣',
      '🏤',
      '🏥',
      '🏦',
      '🏨',
      '🏪',
      '🏫',
      '🏩',
      '💒',
      '🏛️',
      '⛪',
      '🕌',
      '🕍',
      '🛕',
    ],
  },
  {
    key: 'objects',
    title: 'Objects',
    icon: '💡',
    emojis: [
      '⌚',
      '📱',
      '📲',
      '💻',
      '⌨️',
      '🖥️',
      '🖨️',
      '🖱️',
      '🖲️',
      '🕹️',
      '🗜️',
      '💽',
      '💾',
      '💿',
      '📀',
      '📼',
      '📷',
      '📸',
      '📹',
      '🎥',
      '📽️',
      '🎞️',
      '📞',
      '☎️',
      '📟',
      '📠',
      '📺',
      '📻',
      '🎙️',
      '🎚️',
      '🎛️',
      '🧭',
      '⏱️',
      '⏲️',
      '⏰',
      '🕰️',
      '⌛',
      '⏳',
      '📡',
      '🔋',
      '🪫',
      '🔌',
      '💡',
      '🔦',
      '🕯️',
      '🪔',
      '🧯',
      '🛢️',
      '💸',
      '💵',
      '💴',
      '💶',
      '💷',
      '🪙',
      '💰',
      '💳',
      '💎',
      '⚖️',
      '🪜',
      '🧰',
      '🪛',
      '🔧',
      '🔨',
      '⚒️',
      '🛠️',
      '⛏️',
      '🪚',
      '🔩',
      '⚙️',
      '🪤',
      '🧱',
      '⛓️',
      '🧲',
      '🔫',
      '💣',
      '🧨',
      '🪓',
      '🔪',
      '🗡️',
      '⚔️',
      '🛡️',
      '🚬',
      '⚰️',
      '🪦',
      '⚱️',
      '🏺',
      '🔮',
      '📿',
      '🧿',
      '💈',
      '⚗️',
      '🔭',
      '🔬',
      '🕳️',
      '🩹',
      '🩺',
      '💊',
      '💉',
      '🩸',
      '🧬',
      '🦠',
      '🧫',
      '🧪',
      '🌡️',
      '🧹',
      '🪠',
      '🧺',
      '🧻',
      '🚽',
      '🚿',
      '🛁',
      '🛏️',
      '🛋️',
      '🪑',
      '🚪',
      '🪞',
      '🪟',
      '🧳',
    ],
  },
  {
    key: 'symbols',
    title: 'Symbols',
    icon: '➕',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '☮️',
      '✝️',
      '☪️',
      '🕉️',
      '☸️',
      '✡️',
      '🔯',
      '🕎',
      '☯️',
      '☦️',
      '🛐',
      '⛎',
      '♈',
      '♉',
      '♊',
      '♋',
      '♌',
      '♍',
      '♎',
      '♏',
      '♐',
      '♑',
      '♒',
      '♓',
      '🆔',
      '⚛️',
      '🉑',
      '☢️',
      '☣️',
      '📴',
      '📳',
      '🈶',
      '🈚',
      '🈸',
      '🈺',
      '🈷️',
      '✴️',
      '🆚',
      '💮',
      '🉐',
      '㊙️',
      '㊗️',
      '🈴',
      '🈵',
      '🈹',
      '🈲',
      '🅰️',
      '🅱️',
      '🆎',
      '🆑',
      '🅾️',
      '🆘',
      '❌',
      '⭕',
      '🛑',
      '⛔',
      '📛',
      '🚫',
      '💯',
      '💢',
      '♨️',
      '🚷',
      '🚯',
      '🚳',
      '🚱',
      '🔞',
      '📵',
      '🚭',
      '❗',
      '❕',
      '❓',
      '❔',
      '‼️',
      '⁉️',
      '🔅',
      '🔆',
      '〽️',
      '⚠️',
      '🚸',
      '🔱',
      '⚜️',
      '🔰',
      '✅',
      '🈯',
      '💹',
      '❇️',
      '✳️',
      '❎',
      '🌐',
      '💠',
      'Ⓜ️',
      '🌀',
      '💤',
      '🏧',
      '🚾',
      '♿',
      '🅿️',
      '🛗',
      '🈳',
      '🈂️',
      '🛂',
      '🛃',
      '🛄',
      '🛅',
    ],
  },
  {
    key: 'flags',
    title: 'Flags',
    icon: '🏳️',
    emojis: [
      '🏳️',
      '🏴',
      '🏁',
      '🚩',
      '🏳️‍🌈',
      '🏳️‍⚧️',
      '🇪🇬',
      '🇸🇦',
      '🇦🇪',
      '🇶🇦',
      '🇰🇼',
      '🇧🇭',
      '🇴🇲',
      '🇯🇴',
      '🇱🇧',
      '🇲🇦',
      '🇹🇳',
      '🇩🇿',
      '🇺🇸',
      '🇬🇧',
      '🇫🇷',
      '🇩🇪',
      '🇮🇹',
      '🇪🇸',
      '🇹🇷',
      '🇨🇦',
      '🇦🇺',
      '🇯🇵',
      '🇰🇷',
      '🇨🇳',
      '🇮🇳',
      '🇧🇷',
      '🇲🇽',
    ],
  },
]

const studentQuickReplies: QuickReply[] = [
  {
    label: 'طلب بيانات الطالب',
    body: `تمام، علشان نقدر نساعدك بشكل أسرع ابعتلنا البيانات دي:

1. اسمك بالكامل
2. رقم واتساب للتواصل
3. الجامعة / الكلية
4. طالب ولا طالبة؟
5. نوع السكن المطلوب
6. الميزانية المناسبة ليك
7. ميعاد مناسب للمعاينة`,
  },
  {
    label: 'تعليمات المعاينة',
    body: `تمام، قبل ما تروح تعاين السكن، مهم تعرف تعليمات Navienty:

1. لو السكن عجبك، كلمنا الأول قبل أي دفع.
2. الحجز بيتم من خلال المنصة بدفع أول شهر فقط.
3. من الشهر التاني بتدفع للمالك مباشرة.
4. لو تم الدفع خارج المنصة، Navienty مش هتكون مسؤولة عن أي نزاع بينك وبين المالك.

بعد المعاينة ابعتلنا رأيك، ولو مناسب هنكمل معاك خطوات الحجز.`,
  },
  {
    label: 'تعليمات الدفع',
    body: `تمام، لو السكن مناسب ليك وعاوز تحجز:

الحجز بيتم من خلال Navienty بدفع قيمة أول شهر إيجار فقط عن طريق طرق الدفع المتاحة.

بعد تأكيد الدفع، هيجيلك كود تأكيد الحجز، وده بيثبت إن حجزك تم من خلال المنصة.

من الشهر التاني بتدفع للمالك مباشرة.`,
  },
  {
    label: 'تحذير الدفع خارج المنصة',
    body: `تنبيه مهم من Navienty:

أي دفع يتم خارج المنصة بيكون على مسؤوليتك الشخصية، وNavienty مش هتكون مسؤولة عن أي نزاع أو مشكلة تحصل بينك وبين المالك.

علشان نقدر نحمي حجزك ونساعدك في أي مشكلة، لازم أول شهر يتم دفعه من خلال المنصة فقط.`,
  },
  {
    label: 'الشقة غير متاحة',
    body: `نعتذر، السكن ده غير متاح حاليًا أو تم حجزه.

ابعتلنا:
1. الجامعة أو المنطقة اللي عاوز تسكن قريب منها
2. نوع الغرفة المطلوبة
3. الميزانية المناسبة

وهنرشحلك أقرب اختيارات مناسبة من Navienty.`,
  },
  {
    label: 'ميزة التخزين',
    body: `لو حجزت من خلال Navienty، تقدر تستخدم خدمة تخزين الشنط مجانًا.

بعد تأكيد الحجز، هيجيلك كود تأكيد. احتفظ بالكود لأنه بيتم استخدامه للاستفادة من التخزين المجاني.`,
  },
  {
    label: 'طلب Review',
    body: `نتمنى تكون تجربتك مع Navienty كانت مريحة ❤️

لو الخدمة عجبتك، ياريت تسيبلنا Review وتشارك تجربتك مع زمايلك في جروب الدفعة، ده بيساعد طلبة تانية تلاقي سكن آمن بسهولة.`,
  },
]

const ownerQuickReplies: QuickReply[] = [
  {
    label: 'طلب بيانات الشقة',
    body: `أهلًا بحضرتك في Navienty.

علشان نقدر نضيف السكن عندنا على المنصة، محتاجين البيانات دي:

1. اسم حضرتك
2. رقم واتساب للتواصل
3. عنوان الشقة بالتفصيل
4. الشقة مناسبة لطلبة ولا طالبات؟
5. عدد الغرف
6. عدد الحمامات
7. عدد السرائر في كل غرفة
8. سعر السرير أو الغرفة
9. هل يوجد Wi-Fi؟
10. هل يوجد تكييف؟
11. هل العمارة فيها أسانسير؟
12. هل يوجد أمن أو بواب؟`,
  },
  {
    label: 'طلب الصور والفيديو',
    body: `تمام يا فندم، محتاجين من حضرتك صور واضحة للشقة علشان نقدر نعرضها بشكل احترافي على Navienty.

يفضل تبعتلنا:
1. صورة لكل غرفة
2. صورة للحمام
3. صورة للمطبخ
4. صورة للريسبشن لو موجود
5. فيديو سريع للشقة بالكامل
6. صورة لمدخل العمارة لو متاحة

كل ما الصور تكون أوضح، فرصة الحجز بتكون أسرع.`,
  },
  {
    label: 'شرح نظام Navienty للمالك',
    body: `Navienty منصة متخصصة في سكن الطلاب.

إحنا بنساعد حضرتك تعرض الشقة للطلبة الجادين فقط، والطالب بيشوف تفاصيل السكن والصور من خلال المنصة، وبعدها بيتواصل معانا علشان المعاينة والحجز.

الحجز بيتم من خلال المنصة في أول شهر فقط، وبعد كده الطالب بيتعامل مع حضرتك مباشرة من الشهر التاني.`,
  },
  {
    label: 'شرح العمولة',
    body: `نظام Navienty بسيط:

إحنا مش بناخد أي فلوس مقدمًا من المالك.

العمولة بتكون فقط عند إتمام الحجز من خلال المنصة، وبتتخصم من أول شهر إيجار.

بعد أول شهر، الطالب بيدفع لحضرتك مباشرة بدون تدخل من Navienty.`,
  },
  {
    label: 'طلب اللوكيشن',
    body: `محتاجين من حضرتك تبعتلنا اللوكيشن أو أقرب علامة مميزة للشقة.

ده بيساعدنا نعرض السكن للطلبة اللي بيدوروا قريب من الجامعة أو المنطقة المناسبة ليهم.`,
  },
  {
    label: 'تأكيد استلام البيانات',
    body: `تمام يا فندم، استلمنا البيانات والصور.

هنراجع التفاصيل ونجهز السكن للعرض على Navienty، ولو احتجنا أي بيانات إضافية هنبلغ حضرتك هنا على واتساب.`,
  },
  {
    label: 'طلب استكمال ناقص',
    body: `شكرًا لحضرتك، بس لسه محتاجين نستكمل بعض البيانات قبل ما نقدر ننشر السكن:

1. السعر
2. عدد الغرف والسرائر
3. العنوان التفصيلي
4. صور واضحة للشقة
5. هل السكن للطلبة ولا الطالبات؟

ابعتلنا البيانات الناقصة، وهنكمل إضافة السكن فورًا.`,
  },
]

const generalQuickReplies: QuickReply[] = [
  {
    label: 'رسالة ترحيب',
    body: `أهلًا بحضرتك في Navienty 👋

من فضلك ابعتلنا تفاصيل طلبك، وفريقنا هيرد عليك في أقرب وقت.`,
  },
  {
    label: 'طلب توضيح',
    body: `ممكن توضحلنا حضرتك محتاج إيه بالظبط؟

هل حضرتك طالب بتدور على سكن، ولا مالك وعاوز تضيف شقة على Navienty؟`,
  },
]

function getQuickRepliesForConversation(conversationType?: string | null) {
  if (conversationType === 'owner_onboarding') {
    return ownerQuickReplies
  }

  if (conversationType === 'student_booking') {
    return studentQuickReplies
  }

  return [...generalQuickReplies, ...studentQuickReplies, ...ownerQuickReplies]
}

function getSectionLabel(conversationType?: string | null) {
  if (conversationType === 'owner_onboarding') return 'Owner quick replies'
  if (conversationType === 'student_booking') return 'Student quick replies'

  return 'Quick replies'
}

function PaperclipIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m9.2 12.85 5.35-5.35a3.1 3.1 0 0 1 4.38 4.38l-6.7 6.7a5.05 5.05 0 0 1-7.14-7.14l7.05-7.05"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EmojiIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8.7 9.2h.01M15.3 9.2h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M8.5 14.2c.85 1.35 2.05 2.05 3.5 2.05s2.65-.7 3.5-2.05"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m21 21-4.35-4.35M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M21 3 10.7 13.3M21 3l-6.6 18-3.7-7.7L3 9.6 21 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

type AttachmentPickerKind =
  | 'document'
  | 'photos'
  | 'camera'
  | 'audio'
  | 'sticker'

function AttachmentMenuIcon({ icon }: { icon: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg">
      {icon}
    </span>
  )
}

function getReplyTargetPreview(replyToMessage: ReplyTarget) {
  return (
    replyToMessage.body ||
    replyToMessage.media_filename ||
    `[${replyToMessage.message_type}]`
  )
}

export default function ReplyBox({
  conversationId,
  conversationType,
  replyToMessage = null,
  cancelReplyHref,
}: ReplyBoxProps) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const documentInputRef = useRef<HTMLInputElement | null>(null)
  const photosInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const stickerInputRef = useRef<HTMLInputElement | null>(null)

  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [activeEmojiCategory, setActiveEmojiCategory] =
    useState<EmojiCategoryKey>('smileys')
  const [emojiSearch, setEmojiSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const quickReplies = useMemo(
    () => getQuickRepliesForConversation(conversationType),
    [conversationType]
  )

  const visibleEmojiCategories = useMemo(() => {
    const normalizedSearch = emojiSearch.trim().toLowerCase()

    if (!normalizedSearch) {
      const activeCategory =
        emojiCategories.find(
          (category) => category.key === activeEmojiCategory
        ) ?? emojiCategories[0]

      return activeCategory ? [activeCategory] : []
    }

    return emojiCategories
      .map((category) => {
        const filteredEmojis = category.emojis.filter((emoji) =>
          emoji.toLowerCase().includes(normalizedSearch)
        )

        return {
          ...category,
          emojis: filteredEmojis,
        }
      })
      .filter((category) => category.emojis.length > 0)
  }, [activeEmojiCategory, emojiSearch])

  function scrollToOriginalReplyMessage(messageId: string) {
    const target = document.getElementById(`message-${messageId}`)

    if (!target) {
      window.location.hash = `message-${messageId}`
      return
    }

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    const bubble = target.querySelector('.message-bubble-content')

    bubble?.classList.add(
      'ring-4',
      'ring-blue-300',
      'shadow-2xl',
      'shadow-blue-500/30'
    )

    window.setTimeout(() => {
      bubble?.classList.remove(
        'ring-4',
        'ring-blue-300',
        'shadow-2xl',
        'shadow-blue-500/30'
      )
    }, 1800)
  }

  function togglePanel(panel: Exclude<ActivePanel, null>) {
    setError(null)
    setActivePanel((currentPanel) => (currentPanel === panel ? null : panel))
  }

  function insertTextAtCursor(text: string) {
    const textarea = textareaRef.current

    if (!textarea) {
      setMessage((currentMessage) => `${currentMessage}${text}`)
      return
    }

    const currentValue = textarea.value
    const start = textarea.selectionStart ?? currentValue.length
    const end = textarea.selectionEnd ?? currentValue.length

    const nextValue =
      currentValue.slice(0, start) + text + currentValue.slice(end)

    setMessage(nextValue)

    requestAnimationFrame(() => {
      textarea.focus()

      const cursorPosition = start + text.length
      textarea.setSelectionRange(cursorPosition, cursorPosition)
    })
  }

  function handleEmojiClick(emoji: string) {
    insertTextAtCursor(emoji)
    setError(null)
  }

  function handleQuickReplyClick(body: string) {
    setMessage(body)
    setError(null)
    setActivePanel(null)

    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  function openAttachmentPicker(kind: AttachmentPickerKind) {
    setError(null)
    setActivePanel(null)

    if (kind === 'document') documentInputRef.current?.click()
    if (kind === 'photos') photosInputRef.current?.click()
    if (kind === 'camera') cameraInputRef.current?.click()
    if (kind === 'audio') audioInputRef.current?.click()
    if (kind === 'sticker') stickerInputRef.current?.click()
  }

  function handleContactClick() {
    setError(null)
    setActivePanel(null)

    const contactName = window.prompt('Contact name')?.trim()

    if (!contactName) return

    const contactPhone = window.prompt('Contact phone number')?.trim()

    if (!contactPhone) return

    startTransition(async () => {
      const result = await sendWhatsAppContactReplyAction(
        conversationId,
        contactName,
        contactPhone
      )

      if (!result.ok) {
        setError(result.error || 'فشل إرسال جهة الاتصال.')
        return
      }

      router.refresh()
    })
  }

  function handleUnsupportedAttachment(label: string) {
    setError(
      `${label} محتاج implementation منفصل في WhatsApp Cloud API، مش مجرد file upload.`
    )
    setActivePanel(null)
  }

  function handleFileInputChange(
    event: ChangeEvent<HTMLInputElement>,
    kind: AttachmentPickerKind
  ) {
    const files = Array.from(event.currentTarget.files ?? []) as File[]
    event.target.value = ''

    if (files.length === 0) return

    const caption = message.trim()

    setError(null)
    setActivePanel(null)

    startTransition(async () => {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('media_type_hint', kind)

        if (caption) {
          formData.append('caption', caption)
        }

        if (replyToMessage?.id) {
          formData.append('reply_to_message_id', replyToMessage.id)
        }

        const result = await sendWhatsAppMediaReplyAction(
          conversationId,
          formData
        )

        if (!result.ok) {
          setError(result.error || 'فشل إرسال الملف.')
          return
        }
      }

      setMessage('')
      router.refresh()
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const body = message.trim()

    if (!body) {
      setError('اكتب رسالة الأول.')
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await sendWhatsAppReplyAction(
        conversationId,
        body,
        replyToMessage?.id ?? null
      )

      if (!result.ok) {
        setError(result.error || 'فشل إرسال الرسالة.')
        return
      }

      setMessage('')
      setActivePanel(null)
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative shrink-0 border-t border-blue-100 bg-white/95 px-3 py-3 backdrop-blur md:px-5"
    >
      <div className="mx-auto w-full max-w-4xl">
        <input
          ref={documentInputRef}
          type="file"
          className="hidden"
          onChange={(event) => handleFileInputChange(event, 'document')}
          disabled={isPending}
        />

        <input
          ref={photosInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(event) => handleFileInputChange(event, 'photos')}
          disabled={isPending}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => handleFileInputChange(event, 'camera')}
          disabled={isPending}
        />

        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(event) => handleFileInputChange(event, 'audio')}
          disabled={isPending}
        />

        <input
          ref={stickerInputRef}
          type="file"
          accept="image/webp"
          className="hidden"
          onChange={(event) => handleFileInputChange(event, 'sticker')}
          disabled={isPending}
        />

        {activePanel === 'attachments' ? (
          <div className="absolute bottom-[76px] left-3 z-50 w-[calc(100vw-24px)] max-w-[260px] overflow-hidden rounded-[24px] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/20 md:left-5">
            <div className="grid gap-1">
              <button
                type="button"
                onClick={() => openAttachmentPicker('document')}
                disabled={isPending}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <AttachmentMenuIcon icon="📄" />
                <span>Document</span>
              </button>

              <button
                type="button"
                onClick={() => openAttachmentPicker('photos')}
                disabled={isPending}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <AttachmentMenuIcon icon="🖼️" />
                <span>Photos & videos</span>
              </button>

              <button
                type="button"
                onClick={() => openAttachmentPicker('camera')}
                disabled={isPending}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <AttachmentMenuIcon icon="📷" />
                <span>Camera</span>
              </button>

              <button
                type="button"
                onClick={() => openAttachmentPicker('audio')}
                disabled={isPending}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <AttachmentMenuIcon icon="🎧" />
                <span>Audio</span>
              </button>

              <button
                type="button"
                onClick={handleContactClick}
                disabled={isPending}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <AttachmentMenuIcon icon="👤" />
                <span>Contact</span>
              </button>

              <button
                type="button"
                onClick={() => handleUnsupportedAttachment('Poll')}
                disabled={isPending}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-400 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <AttachmentMenuIcon icon="📊" />
                <span>Poll</span>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-400">
                  Soon
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleUnsupportedAttachment('Event')}
                disabled={isPending}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-400 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <AttachmentMenuIcon icon="🗓️" />
                <span>Event</span>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-400">
                  Soon
                </span>
              </button>

              <button
                type="button"
                onClick={() => openAttachmentPicker('sticker')}
                disabled={isPending}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <AttachmentMenuIcon icon="➕" />
                <span>New sticker</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => handleUnsupportedAttachment('Catalogue')}
                disabled={isPending}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-400 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <AttachmentMenuIcon icon="🏪" />
                <span>Catalogue</span>
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-400">
                  Soon
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActivePanel('quickReplies')}
                disabled={isPending}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <AttachmentMenuIcon icon="⚡" />
                <span>Quick replies</span>
              </button>
            </div>

            <div className="absolute bottom-[-9px] left-[30px] h-4 w-4 rotate-45 border-b border-r border-slate-200 bg-white" />
          </div>
        ) : null}

        {activePanel === 'emojis' ? (
          <div className="absolute bottom-[76px] left-3 z-50 w-[calc(100vw-24px)] max-w-[430px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 md:left-5">
            <div className="p-3 pb-2">
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <SearchIcon />
                </div>

                <input
                  value={emojiSearch}
                  onChange={(event) => setEmojiSearch(event.target.value)}
                  placeholder="Search emoji"
                  className="h-12 w-full rounded-full border border-transparent bg-slate-100 pl-12 pr-4 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-100 focus:bg-slate-50 focus:ring-4 focus:ring-blue-50"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-[315px] overflow-y-auto px-4 pb-3">
              {visibleEmojiCategories.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm font-semibold text-slate-500">
                  No emojis found
                </div>
              ) : (
                visibleEmojiCategories.map((category) => (
                  <div key={category.key} className="pb-2">
                    <h3 className="mb-2 text-sm font-semibold text-slate-500">
                      {emojiSearch.trim() ? 'Search results' : category.title}
                    </h3>

                    <div className="grid grid-cols-8 gap-1">
                      {category.emojis.map((emoji, index) => (
                        <button
                          key={`${category.key}-${emoji}-${index}`}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          disabled={isPending}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-[28px] leading-none transition hover:bg-blue-50 active:scale-95 disabled:opacity-50"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-2">
              {emojiCategories.map((category) => {
                const isActive =
                  category.key === activeEmojiCategory && !emojiSearch.trim()

                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => {
                      setActiveEmojiCategory(category.key)
                      setEmojiSearch('')
                    }}
                    disabled={isPending}
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-xl text-lg transition disabled:opacity-50',
                      isActive
                        ? 'bg-blue-50 text-[#0B55FF]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-[#0B55FF]',
                    ].join(' ')}
                    title={category.title}
                  >
                    {category.icon}
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => {
                  setActivePanel(null)
                  setEmojiSearch('')
                }}
                disabled={isPending}
                className="ml-2 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                title="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="absolute bottom-[-9px] left-[78px] h-4 w-4 rotate-45 border-b border-r border-slate-200 bg-white" />
          </div>
        ) : null}

        {activePanel === 'quickReplies' ? (
          <div className="absolute bottom-[76px] left-3 z-50 w-[calc(100vw-24px)] max-w-[520px] overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-2xl shadow-slate-950/20 md:left-5">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-black text-slate-950">
                  {getSectionLabel(conversationType)}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  اختار رد جاهز علشان يتحط في الرسالة
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                disabled={isPending}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="max-h-[280px] overflow-y-auto p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply.label}
                    type="button"
                    onClick={() => handleQuickReplyClick(reply.body)}
                    disabled={isPending}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0B55FF] disabled:opacity-50"
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="absolute bottom-[-9px] left-[30px] h-4 w-4 rotate-45 border-b border-r border-blue-100 bg-white" />
          </div>
        ) : null}

        {replyToMessage ? (
          <div className="mb-2 flex items-start justify-between gap-3 rounded-2xl border-l-4 border-[#0B55FF] bg-blue-50 px-4 py-3 text-sm ring-1 ring-blue-100">
            <button
              type="button"
              onClick={() => scrollToOriginalReplyMessage(replyToMessage.id)}
              className="min-w-0 flex-1 text-left"
              title="Go to original message"
            >
              <div className="text-xs font-black text-[#0B55FF]">
                Replying to {replyToMessage.direction === 'outbound' ? 'your message' : 'customer'}
              </div>

              <div className="mt-1 truncate font-medium text-slate-700" dir="auto">
                {getReplyTargetPreview(replyToMessage)}
              </div>
            </button>

            <Link
              href={cancelReplyHref || `/admin/whatsapp/${conversationId}`}
              className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm transition hover:text-red-600"
            >
              Cancel
            </Link>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => togglePanel('attachments')}
            disabled={isPending}
            className={[
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50',
              activePanel === 'attachments'
                ? 'bg-[#0B55FF] text-white shadow-lg shadow-blue-500/20'
                : 'bg-[#F3F7FF] text-slate-500 hover:bg-blue-50 hover:text-[#0B55FF]',
            ].join(' ')}
            title="Attachments"
          >
            <PlusIcon />
          </button>

          <button
            type="button"
            onClick={() => togglePanel('emojis')}
            disabled={isPending}
            className={[
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50',
              activePanel === 'emojis'
                ? 'bg-[#0B55FF] text-white shadow-lg shadow-blue-500/20'
                : 'bg-[#F3F7FF] text-slate-500 hover:bg-blue-50 hover:text-[#0B55FF]',
            ].join(' ')}
            title="Emojis"
          >
            <EmojiIcon />
          </button>

          <div className="min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value)
                setError(null)
              }}
              rows={1}
              placeholder="Type a message..."
              className="max-h-[140px] min-h-11 w-full resize-none rounded-[22px] border border-transparent bg-[#F3F7FF] px-4 py-3 text-sm font-medium leading-5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50"
              disabled={isPending}
              dir="auto"
            />

            <div className="mt-1 flex items-center justify-between gap-3 px-2">
              <div className="text-[11px] font-semibold text-slate-400">
                {message.trim().length} characters
              </div>

              {error ? (
                <p className="text-xs font-bold text-red-600">{error}</p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !message.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B55FF] text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#0048DB] disabled:cursor-not-allowed disabled:opacity-50"
            title="Send"
          >
            {isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
      </div>
    </form>
  )
}