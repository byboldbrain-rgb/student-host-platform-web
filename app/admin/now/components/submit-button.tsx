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
        'rounded-xl px-4 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60',
        className,
      ].join(' ')}
    >
      {pending ? pendingText : idleText}
    </button>
  );
}
