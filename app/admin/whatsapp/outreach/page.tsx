import Link from 'next/link'
import { requireSuperAdminAccess } from '@/src/lib/admin-auth'
import OutreachForm from './OutreachForm'

export default async function WhatsAppOutreachPage() {
  await requireSuperAdminAccess()

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div>
        <Link
          href="/admin/whatsapp"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to WhatsApp Inbox
        </Link>

        <h1 className="mt-3 text-2xl font-bold">WhatsApp Owner Outreach</h1>

        <p className="mt-1 text-sm text-gray-500">
          Import daily owner numbers, prevent duplicates, and prepare WhatsApp
          template campaigns.
        </p>
      </div>

      <section className="rounded-3xl border bg-white p-5">
        <h2 className="text-lg font-semibold">CSV format</h2>

        <p className="mt-2 text-sm text-gray-500">
          Paste rows using this exact order:
        </p>

        <pre className="mt-3 overflow-x-auto rounded-2xl bg-gray-950 p-4 text-sm text-white">
{`phone,owner_name,area_name,area_slug
01123456789,أحمد,أسيوط الجديدة,asyut-new
01098765432,محمود,الوليدية,el-walidia`}
        </pre>
      </section>

      <OutreachForm />
    </main>
  )
}