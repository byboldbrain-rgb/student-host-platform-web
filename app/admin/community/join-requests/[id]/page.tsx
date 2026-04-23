import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  University,
  User2,
  Users,
  XCircle,
} from "lucide-react";
import StatusActions from "./status-actions";
import AdminLogoutButton from "@/app/admin/components/AdminLogoutButton";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getRoleLabel(role: string | null) {
  switch (role) {
    case "pr_communications":
      return "PR & Communications";
    case "photographer":
      return "Photographer";
    case "videographer":
      return "Videographer";
    case "video_editor":
      return "Video Editor";
    case "social_media":
      return "Social Media";
    case "content_creator":
      return "Content Creator";
    case "graphic_designer":
      return "Graphic Designer";
    case "hr":
      return "HR";
    default:
      return "-";
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case "accepted":
      return {
        label: "Accepted",
        className: "bg-emerald-100 text-emerald-700",
        icon: CheckCircle2,
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "bg-rose-100 text-rose-700",
        icon: XCircle,
      };
    case "reviewed":
      return {
        label: "Reviewed",
        className: "bg-amber-100 text-amber-700",
        icon: FileText,
      };
    default:
      return {
        label: "Pending",
        className: "bg-blue-100 text-blue-700",
        icon: Clock3,
      };
  }
}

function BrandLogo() {
  return (
    <Link
      href="/admin"
      className="navienty-logo"
      aria-label="Navienty admin home"
    >
      <img
        src="https://i.ibb.co/p6CBgjz0/Navienty-13.png"
        alt="Navienty icon"
        className="navienty-logo-icon"
      />
      <span className="navienty-logo-text-wrap">
        <img
          src="https://i.ibb.co/kVC7z9x7/Navienty-15.png"
          alt="Navienty"
          className="navienty-logo-text"
        />
      </span>
    </Link>
  );
}

function MobileBottomNavItem({
  href,
  label,
  isPrimary = false,
}: {
  href: string;
  label: string;
  isPrimary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[11px] font-semibold leading-tight transition-all duration-200",
        isPrimary
          ? "border border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
          : "border border-gray-200 bg-white text-[#222222] shadow-[0_4px_14px_rgba(15,23,42,0.05)]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

export default async function JoinRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("community_join_requests")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !data) {
    notFound();
  }

  const status = getStatusConfig(data.status);
  const StatusIcon = status.icon;

  return (
    <>
      <style>{`
        .navienty-logo {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          overflow: visible;
          transform: none;
          margin-top: -10px;
        }

        .navienty-logo-icon {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }

        .navienty-logo-text-wrap {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(-6px);
          transition:
            max-width 0.35s ease,
            opacity 0.25s ease,
            transform 0.35s ease;
          display: flex;
          align-items: center;
        }

        .navienty-logo:hover .navienty-logo-text-wrap,
        .navienty-logo:focus-visible .navienty-logo-text-wrap {
          max-width: 120px;
          opacity: 1;
          transform: translateX(0);
        }

        .navienty-logo-text {
          width: 112px;
          min-width: 112px;
          height: auto;
          object-fit: contain;
          display: block;
          transform: translateY(-2px);
        }

        .desktop-header-nav-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #20212a;
          text-decoration: none;
          font-size: 15px;
          line-height: 1;
          border: none;
          background: none;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          padding: 8px 0;
          transition: color 0.3s ease;
        }

        .desktop-header-nav-button::before {
          margin-left: auto;
        }

        .desktop-header-nav-button::after,
        .desktop-header-nav-button::before {
          content: '';
          width: 0%;
          height: 2px;
          background: #000000;
          display: block;
          transition: 0.5s;
          position: absolute;
          left: 0;
        }

        .desktop-header-nav-button::before {
          top: 0;
        }

        .desktop-header-nav-button::after {
          bottom: 0;
        }

        .desktop-header-nav-button:hover::after,
        .desktop-header-nav-button:hover::before,
        .desktop-header-nav-button:focus-visible::after,
        .desktop-header-nav-button:focus-visible::before {
          width: 100%;
        }

        .desktop-header-nav-button-active {
          color: #054aff;
        }

        .desktop-header-nav-button-inactive {
          color: #20212a;
        }

        .desktop-header-nav-button-inactive:hover,
        .desktop-header-nav-button-inactive:focus-visible {
          color: #054aff;
        }

        @media (max-width: 768px) {
          .navienty-logo {
            transform: none;
            margin-top: 0;
          }

          .navienty-logo-icon {
            width: 42px;
            height: 42px;
          }

          .navienty-logo-text-wrap {
            display: none;
          }

          .mobile-header-inner {
            justify-content: center !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[#fbfbfb] pb-28 text-gray-700 md:pb-0">
        <header className="sticky top-0 z-[110] bg-[#f5f7f9]">
          <div className="mobile-header-inner flex h-[72px] w-full items-center justify-between px-4 pt-2 md:px-6 lg:px-8">
            <BrandLogo />

            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/admin/community/posts"
                className="desktop-header-nav-button desktop-header-nav-button-inactive"
              >
                Community Posts
              </Link>

              <Link
                href="/admin/community/join-requests"
                className="desktop-header-nav-button desktop-header-nav-button-active"
              >
                Join Requests
              </Link>

              <AdminLogoutButton />
            </div>

            <div className="md:hidden">
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
             

              <div className="mt-4">
                

                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#222222] md:text-3xl">
                  {data.full_name || "Applicant Details"}
                </h1>

               
              </div>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${status.className}`}
            >
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </div>
          </div>

          <section className="mt-6 rounded-[32px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)] md:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_380px]">
              <div className="space-y-4">
                <div className="rounded-[28px] border border-black/[0.06] bg-[#fafcff] p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <User2 className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-[#222222] md:text-xl">
                        Applicant Overview
                      </h2>
                    
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <InfoCard
                      icon={<Mail className="h-4 w-4" />}
                      label="Email"
                      value={data.email}
                      breakValue
                    />
                    <InfoCard
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone"
                      value={data.phone}
                    />
                    <InfoCard
                      icon={<MapPin className="h-4 w-4" />}
                      label="City"
                      value={data.city_text}
                    />
                    <InfoCard
                      icon={<University className="h-4 w-4" />}
                      label="University"
                      value={data.university_text}
                    />
                    <InfoCard
                      icon={<Users className="h-4 w-4" />}
                      label="Desired Role"
                      value={getRoleLabel(data.desired_role)}
                    />
                    <InfoCard
                      icon={<FileText className="h-4 w-4" />}
                      label="Status"
                      value={status.label}
                    />
                  </div>
                </div>

                
              </div>

              <aside className="space-y-4">
                <div className="rounded-[28px] border border-black/[0.06] bg-[#fafcff] p-5 md:p-6">
                  <h3 className="text-lg font-semibold text-[#222222]">
                    Request Actions
                  </h3>
                  

                  <div className="mt-5">
                    <StatusActions
                      requestId={data.id}
                      currentStatus={data.status}
                    />
                  </div>
                </div>

                

                <Link
                  href="/admin/community/join-requests"
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_12px_26px_rgba(37,99,235,0.28)]"
                >
                  Back to All Requests
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </aside>
            </div>
          </section>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-[640px] grid-cols-2 gap-2">
            <MobileBottomNavItem href="/admin/community/posts" label="Posts" />
            <MobileBottomNavItem
              href="/admin/community/join-requests"
              label="Join Requests"
              isPrimary
            />
          </div>
        </nav>
      </main>
    </>
  );
}

function InfoCard({
  icon,
  label,
  value,
  breakValue = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  breakValue?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.04] bg-white px-4 py-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#98a2b3]">
        {icon}
        {label}
      </div>
      <p
        className={[
          "mt-2 text-sm font-medium text-[#222222] md:text-[15px]",
          breakValue ? "break-all" : "",
        ].join(" ")}
      >
        {value || "-"}
      </p>
    </div>
  );
}