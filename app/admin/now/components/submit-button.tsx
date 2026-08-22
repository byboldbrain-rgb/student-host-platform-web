'use client';

import { useFormStatus } from 'react-dom';

export default function SubmitButton({
  idleText,
  pendingText = 'جاري التنفيذ...',
  className = '',
}: {
  idleText: string;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        'inline-flex min-h-[46px] items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      ].join(' ')}
    >
      {pending ? pendingText : idleText}
    </button>
  );
}
