import Link from "next/link";
import DoctorForm from "../../components/DoctorForm";
import {
  getCitiesForAdmin,
  getHealthSpecialtiesForAdmin,
} from "@/src/lib/services/health/admin";
import AdminLogoutButton from "@/app/admin/components/AdminLogoutButton";

export default async function NewDoctorPage() {
  const [cities, specialties] = await Promise.all([
    getCitiesForAdmin(),
    getHealthSpecialtiesForAdmin(),
  ]);

  return (
    <main className="min-h-screen bg-[#ffffff] text-gray-700">
      <header className="sticky top-0 z-40 border-b border-[#ebe7ff] bg-[#f8f6ff]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[110px] max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/services/health" className="shrink-0">
              <img
                src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                alt="Navienty"
                className="block h-auto w-[180px] md:w-[130px]"
              />
            </Link>

            <div className="hidden md:block">
             
           
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 lg:px-8">
        <DoctorForm cities={cities} specialties={specialties} />
      </div>
    </main>
  );
}