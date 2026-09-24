'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Bell, BellRing, LoaderCircle } from 'lucide-react';

import {
  disableNowOrderPushSubscriptionAction,
  getNowOrderPushSubscriptionStatusAction,
  saveNowOrderPushSubscriptionAction,
} from '../push-actions';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isPushSupported() {
  return (
    typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
  );
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export default function OrderNotificationsButton() {
  const [isPending, startTransition] = useTransition();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

  const buttonLabel = useMemo(() => {
    if (permission === 'unsupported') return 'Notifications غير مدعومة';
    if (permission === 'denied') return 'Notifications محظورة';
    if (isEnabled) return 'Notifications مفعلة';
    return 'Notifications';
  }, [isEnabled, permission]);

  useEffect(() => {
    let cancelled = false;

    async function prepareNotifications() {
      if (!isPushSupported()) {
        if (!cancelled) {
          setPermission('unsupported');
          if (isIosDevice() && !isStandaloneDisplay()) {
            setMessage('على iPhone: أضف Navienty إلى الشاشة الرئيسية ثم افتحه من الأيقونة لتفعيل الإشعارات.');
          }
        }
        return;
      }

      setPermission(Notification.permission);

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const existingSubscription = await registration.pushManager.getSubscription();

        if (cancelled) return;

        setSubscription(existingSubscription);

        if (!existingSubscription) {
          setIsEnabled(false);
          return;
        }

        const status = await getNowOrderPushSubscriptionStatusAction(
          existingSubscription.endpoint,
        );

        if (!cancelled) {
          setIsEnabled(status.enabled);
        }
      } catch {
        if (!cancelled) {
          setMessage('تعذر تجهيز الإشعارات على هذا الجهاز.');
        }
      }
    }

    void prepareNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = () => {
    if (isPending) return;
    setMessage(null);

    startTransition(async () => {
      try {
        if (!isPushSupported()) {
          setPermission('unsupported');
          setMessage(
            isIosDevice() && !isStandaloneDisplay()
              ? 'على iPhone: استخدم Add to Home Screen أولًا، ثم افتح Navienty من الأيقونة وفعّل Notifications.'
              : 'المتصفح الحالي لا يدعم Push Notifications.',
          );
          return;
        }

        if (!vapidPublicKey) {
          setMessage('VAPID public key غير موجودة في إعدادات المشروع.');
          return;
        }

        const nextPermission = await Notification.requestPermission();
        setPermission(nextPermission);

        if (nextPermission !== 'granted') {
          setMessage('لازم تسمح بالإشعارات من إعدادات المتصفح علشان تستقبل الطلبات الجديدة.');
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        let nextSubscription = await registration.pushManager.getSubscription();

        if (!nextSubscription) {
          nextSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        }

        await saveNowOrderPushSubscriptionAction(
          nextSubscription.toJSON(),
          navigator.userAgent,
        );

        setSubscription(nextSubscription);
        setIsEnabled(true);
        setMessage('تم تفعيل إشعارات الطلبات الجديدة على الجهاز ده ✅');
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'حصلت مشكلة أثناء تفعيل الإشعارات.',
        );
      }
    });
  };

  const handleDisable = () => {
    if (isPending || !subscription) return;
    setMessage(null);

    startTransition(async () => {
      try {
        await disableNowOrderPushSubscriptionAction(subscription.endpoint);
        setIsEnabled(false);
        setMessage('تم إيقاف إشعارات الطلبات الجديدة على الجهاز ده.');
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'تعذر إيقاف إشعارات الطلبات.',
        );
      }
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isEnabled ? handleDisable : handleEnable}
        disabled={isPending || permission === 'unsupported' || permission === 'denied'}
        aria-pressed={isEnabled}
        className={[
          'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition',
          isEnabled
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
          'disabled:cursor-not-allowed disabled:opacity-60',
        ].join(' ')}
      >
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
        ) : isEnabled ? (
          <BellRing aria-hidden="true" size={16} />
        ) : (
          <Bell aria-hidden="true" size={16} />
        )}
        {isPending ? 'جاري الحفظ…' : buttonLabel}
      </button>

      {message ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium leading-5 text-slate-600 shadow-xl">
          {message}
        </div>
      ) : null}
    </div>
  );
}
