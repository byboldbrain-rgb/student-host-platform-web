'use client'

import Link from 'next/link'

type TopActionButtonProps = {
  href: string
  label: string
}

export default function TopActionButton({
  href,
  label,
}: TopActionButtonProps) {
  return (
    <Link href={href} className="top-action-button">
      <div>
        <span>{label}</span>
      </div>
    </Link>
  )
}