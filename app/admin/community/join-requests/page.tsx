import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Mail,
  Phone,
  University,
  User2,
  Users,
  XCircle,
} from "lucide-react";
import AdminLogoutButton from "@/app/admin/components/AdminLogoutButton";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type JoinRequestRow = {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city_text: string | null;
  university_text: string | null;
  desired_role: string | null;
  status: string;
  created_at: string;
};

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
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "bg-rose-100 text-rose-700",
      };
    case "reviewed":
      return {
        label: "Reviewed",
        className: "bg-amber-100 text-amber-700",
      };
    default:
      return {
        label: "Pending",
        className: "bg-blue-100 text-blue-700",
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

export default async function CommunityJoinRequestsPage() {
  const { data, error } = await supabase
    .from("community_join_requests")
    .select(`
      id,
      full_name,
      email,
      phone,
      city_text,
      university_text,
      desired_role,
      status,
      created_at
    `)
    .order("created_at", { ascending: false });

  const requests: JoinRequestRow[] = data ?? [];
  const acceptedCount = requests.filter((item) => item.status === "accepted").length;
  const reviewedCount = requests.filter((item) => item.status === "reviewed").length;
  const pendingCount = requests.filter(
    (item) =>
      item.status !== "accepted" &&
      item.status !== "rejected" &&
      item.status !== "reviewed"
  ).length;

  if (error) {
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
            <div className="rounded-[32px] border border-rose-200 bg-white p-6 shadow-[0_10px_36px_rgba(15,23,42,0.05)] md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                <XCircle className="h-3.5 w-3.5" />
                Failed to load requests
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#222222]">
                Community Join Requests
              </h1>

              <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error.message}
              </p>
            </div>
          </div>

          <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
            <div className="mx-auto grid max-w-[640px] grid-cols-2 gap-2">
              <MobileBottomNavItem
                href="/admin/community/posts"
                label="Posts"
              />
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
          
          <section className="mt-6 rounded-[32px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[#222222]">
                  All Requests
                </h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Open any request to review applicant details.
                </p>
              </div>

              <span className="rounded-full border border-gray-200 bg-[#fafafa] px-3 py-1 text-xs font-semibold text-[#475467]">
                {requests.length} requests
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-gray-200 bg-[#fafcff] px-6 py-14 text-center">
                <p className="text-sm font-medium text-[#667085]">
                  No join requests yet.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-[28px] border border-black/[0.06] xl:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-[#fafcff]">
                        <tr>
                          <th className="px-5 py-4 text-left text-sm font-semibold text-[#222222]">
                            Applicant
                          </th>
                          <th className="px-5 py-4 text-left text-sm font-semibold text-[#222222]">
                            Role
                          </th>
                          <th className="px-5 py-4 text-left text-sm font-semibold text-[#222222]">
                            City
                          </th>
                          <th className="px-5 py-4 text-left text-sm font-semibold text-[#222222]">
                            University
                          </th>
                          <th className="px-5 py-4 text-left text-sm font-semibold text-[#222222]">
                            Contact
                          </th>
                          <th className="px-5 py-4 text-left text-sm font-semibold text-[#222222]">
                            Status
                          </th>
                          <th className="px-5 py-4 text-left text-sm font-semibold text-[#222222]">
                            Submitted
                          </th>
                          <th className="px-5 py-4 text-left text-sm font-semibold text-[#222222]">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {requests.map((row) => {
                          const status = getStatusConfig(row.status);

                          return (
                            <tr
                              key={row.id}
                              className="border-t border-[#edf0f5] align-top"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                    <User2 className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-[#222222]">
                                      {row.full_name || "-"}
                                    </p>
                                    <p className="mt-1 text-xs text-[#98a2b3]">
                                      ID #{row.id}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 text-sm text-[#4b5563]">
                                {getRoleLabel(row.desired_role)}
                              </td>

                              <td className="px-5 py-4 text-sm text-[#4b5563]">
                                {row.city_text || "-"}
                              </td>

                              <td className="px-5 py-4 text-sm text-[#4b5563]">
                                {row.university_text || "-"}
                              </td>

                              <td className="px-5 py-4 text-sm text-[#4b5563]">
                                <div>{row.email || "-"}</div>
                                <div className="mt-1">{row.phone || "-"}</div>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                                >
                                  {status.label}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-sm text-[#4b5563]">
                                {formatDate(row.created_at)}
                              </td>

                              <td className="px-5 py-4">
                                <Link
                                  href={`/admin/community/join-requests/${row.id}`}
                                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_12px_26px_rgba(37,99,235,0.28)]"
                                >
                                  View
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4 xl:hidden">
                  {requests.map((row) => {
                    const status = getStatusConfig(row.status);

                    return (
                      <article
                        key={row.id}
                        className="rounded-[28px] border border-black/[0.06] bg-[#fafcff] p-4 md:p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                              <User2 className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate text-base font-semibold text-[#222222]">
                                {row.full_name || "-"}
                              </h3>
                              <p className="mt-1 text-sm text-[#667085]">
                                {getRoleLabel(row.desired_role)}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-black/[0.04] bg-white px-4 py-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#98a2b3]">
                              <MapPin className="h-3.5 w-3.5" />
                              City
                            </div>
                            <p className="mt-2 text-sm font-medium text-[#222222]">
                              {row.city_text || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-black/[0.04] bg-white px-4 py-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#98a2b3]">
                              <University className="h-3.5 w-3.5" />
                              University
                            </div>
                            <p className="mt-2 text-sm font-medium text-[#222222]">
                              {row.university_text || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-black/[0.04] bg-white px-4 py-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#98a2b3]">
                              <Mail className="h-3.5 w-3.5" />
                              Email
                            </div>
                            <p className="mt-2 break-all text-sm font-medium text-[#222222]">
                              {row.email || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-black/[0.04] bg-white px-4 py-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#98a2b3]">
                              <Phone className="h-3.5 w-3.5" />
                              Phone
                            </div>
                            <p className="mt-2 text-sm font-medium text-[#222222]">
                              {row.phone || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <p className="text-xs font-medium text-[#98a2b3]">
                            Submitted: {formatDate(row.created_at)}
                          </p>

                          <Link
                            href={`/admin/community/join-requests/${row.id}`}
                            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-blue-600 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-700 hover:shadow-[0_12px_26px_rgba(37,99,235,0.28)]"
                          >
                            View Request
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
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