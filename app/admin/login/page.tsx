'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

async function getFoodEditorAllowedPath(
  supabase: ReturnType<typeof createClient>,
  adminUserId: string
) {
  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('code', 'food_editor')
    .maybeSingle()

  if (!roleData?.id) {
    return null
  }

  const { data: assignment } = await supabase
    .from('admin_role_assignments')
    .select('scope_id')
    .eq('admin_user_id', adminUserId)
    .eq('role_id', roleData.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignment?.scope_id) {
    return null
  }

  const { data: scope } = await supabase
    .from('admin_scopes')
    .select('reference_id')
    .eq('id', assignment.scope_id)
    .maybeSingle()

  if (!scope?.reference_id) {
    return null
  }

  return `/admin/services/food-grocery/${scope.reference_id}`
}

async function getUniversitySuppliesEditorAllowedPath(
  supabase: ReturnType<typeof createClient>,
  adminUserId: string
) {
  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('code', 'university_supplies_editor')
    .maybeSingle()

  if (!roleData?.id) {
    return null
  }

  const { data: assignment } = await supabase
    .from('admin_role_assignments')
    .select('scope_id')
    .eq('admin_user_id', adminUserId)
    .eq('role_id', roleData.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignment?.scope_id) {
    return null
  }

  const { data: scope } = await supabase
    .from('admin_scopes')
    .select('reference_id')
    .eq('id', assignment.scope_id)
    .maybeSingle()

  if (!scope?.reference_id) {
    return null
  }

  return `/admin/services/university-supplies/${scope.reference_id}`
}

async function getStudentActivitiesEditorAllowedPath(
  supabase: ReturnType<typeof createClient>,
  adminUserId: string
) {
  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('code', 'student_activities_editor')
    .maybeSingle()

  if (!roleData?.id) {
    return null
  }

  const { data: assignment } = await supabase
    .from('admin_role_assignments')
    .select('scope_id')
    .eq('admin_user_id', adminUserId)
    .eq('role_id', roleData.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignment?.scope_id) {
    return null
  }

  const { data: scope } = await supabase
    .from('admin_scopes')
    .select('reference_uuid')
    .eq('id', assignment.scope_id)
    .maybeSingle()

  if (!scope?.reference_uuid) {
    return null
  }

  return `/admin/services/student-activities/${scope.reference_uuid}`
}

async function getStudentActivitiesReceiverAllowedPath(
  supabase: ReturnType<typeof createClient>,
  adminUserId: string
) {
  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('code', 'student_activities_receiver')
    .maybeSingle()

  if (!roleData?.id) {
    return null
  }

  const { data: assignment } = await supabase
    .from('admin_role_assignments')
    .select('scope_id')
    .eq('admin_user_id', adminUserId)
    .eq('role_id', roleData.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignment?.scope_id) {
    return null
  }

  const { data: scope } = await supabase
    .from('admin_scopes')
    .select('reference_uuid')
    .eq('id', assignment.scope_id)
    .maybeSingle()

  if (!scope?.reference_uuid) {
    return null
  }

  return `/admin/services/student-activities/${scope.reference_uuid}/applications`
}

async function getCoworkingEditorAllowedPath(
  supabase: ReturnType<typeof createClient>,
  adminUserId: string
) {
  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('code', 'coworking_editor')
    .maybeSingle()

  if (!roleData?.id) {
    return null
  }

  const { data: assignment } = await supabase
    .from('admin_role_assignments')
    .select('scope_id')
    .eq('admin_user_id', adminUserId)
    .eq('role_id', roleData.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignment?.scope_id) {
    return null
  }

  const { data: scope } = await supabase
    .from('admin_scopes')
    .select('reference_uuid, reference_id')
    .eq('id', assignment.scope_id)
    .maybeSingle()

  if (scope?.reference_uuid) {
    return `/admin/services/co-working-spaces/${scope.reference_uuid}`
  }

  if (scope?.reference_id) {
    return `/admin/services/co-working-spaces/${scope.reference_id}`
  }

  return null
}

async function getCoworkingReceiverAllowedPath(
  supabase: ReturnType<typeof createClient>,
  adminUserId: string
) {
  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('code', 'coworking_receiver')
    .maybeSingle()

  if (!roleData?.id) {
    return null
  }

  const { data: assignment } = await supabase
    .from('admin_role_assignments')
    .select('scope_id')
    .eq('admin_user_id', adminUserId)
    .eq('role_id', roleData.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!assignment?.scope_id) {
    return null
  }

  const { data: scope } = await supabase
    .from('admin_scopes')
    .select('reference_uuid, reference_id')
    .eq('id', assignment.scope_id)
    .maybeSingle()

  if (scope?.reference_uuid) {
    return `/admin/services/co-working-spaces/${scope.reference_uuid}/booking-requests`
  }

  if (scope?.reference_id) {
    return `/admin/services/co-working-spaces/${scope.reference_id}/booking-requests`
  }

  return '/admin/services/co-working-spaces/booking-requests'
}

async function getDefaultAdminRoute(
  supabase: ReturnType<typeof createClient>,
  admin: {
    id: string
    role?: string | null
    department?: string | null
    owner_id?: string | null
  }
) {
  if (admin.role === 'property_owner') {
    return admin.owner_id ? '/admin/owners' : '/admin/unauthorized'
  }

  if (admin.role === 'super_admin') {
    return '/admin'
  }

  if (admin.role === 'accountant') {
    return '/admin/finance/accountant'
  }

  if (admin.role === 'AR') {
    return '/admin/finance/deposit-requests'
  }

  if (admin.role === 'AP') {
    return '/admin/finance/owner-settlements'
  }

  if (admin.role === 'properties_super_admin') {
    return '/admin/properties'
  }

  if (admin.role === 'property_adder') {
    return '/admin/properties/new'
  }

  if (admin.role === 'property_editor') {
    return '/admin/properties'
  }

  if (admin.role === 'property_receiver') {
    return '/admin/properties/booking-requests'
  }

  if (admin.role === 'food_super_admin') {
    return '/admin/services/food-grocery'
  }

  if (admin.role === 'food_adder') {
    return '/admin/services/food-grocery/new'
  }

  if (admin.role === 'food_editor') {
    const allowedPath = await getFoodEditorAllowedPath(supabase, admin.id)
    return allowedPath || '/admin/unauthorized'
  }

  if (admin.role === 'food_receiver') {
    return '/admin/services/food-grocery/orders'
  }

  if (admin.role === 'university_supplies_super_admin') {
    return '/admin/services/university-supplies'
  }

  if (admin.role === 'university_supplies_adder') {
    return '/admin/services/university-supplies/new'
  }

  if (admin.role === 'university_supplies_editor') {
    const allowedPath = await getUniversitySuppliesEditorAllowedPath(
      supabase,
      admin.id
    )
    return allowedPath || '/admin/unauthorized'
  }

  if (admin.role === 'university_supplies_receiver') {
    return '/admin/services/university-supplies/orders'
  }

  if (admin.role === 'health_super_admin') {
    return '/admin/services/health'
  }

  if (admin.role === 'health_adder') {
    return '/admin/services/health/doctors/new'
  }

  if (admin.role === 'health_editor') {
    return '/admin/services/health'
  }

  if (admin.role === 'health_receiver') {
    return '/admin/services/health'
  }

  if (admin.role === 'student_activities_super_admin') {
    return '/admin/services/student-activities'
  }

  if (admin.role === 'student_activities_adder') {
    return '/admin/services/student-activities/new'
  }

  if (admin.role === 'student_activities_editor') {
    const allowedPath = await getStudentActivitiesEditorAllowedPath(
      supabase,
      admin.id
    )
    return allowedPath || '/admin/unauthorized'
  }

  if (admin.role === 'student_activities_receiver') {
    const allowedPath = await getStudentActivitiesReceiverAllowedPath(
      supabase,
      admin.id
    )
    return allowedPath || '/admin/unauthorized'
  }

  if (admin.role === 'coworking_super_admin') {
    return '/admin/services/co-working-spaces'
  }

  if (admin.role === 'coworking_adder') {
    return '/admin/services/co-working-spaces/new'
  }

  if (admin.role === 'coworking_editor') {
    const allowedPath = await getCoworkingEditorAllowedPath(supabase, admin.id)
    return allowedPath || '/admin/unauthorized'
  }

  if (admin.role === 'coworking_receiver') {
    const allowedPath = await getCoworkingReceiverAllowedPath(supabase, admin.id)
    return allowedPath || '/admin/services/co-working-spaces/booking-requests'
  }

  if (admin.role === 'community_super_admin') {
    return '/admin/community/posts'
  }

  if (admin.role === 'community_editor') {
    return '/admin/community/posts'
  }

  if (admin.role === 'community_hr') {
    return '/admin/community/join-requests'
  }

  if (admin.department === 'student_activities') {
    return '/admin/services/student-activities'
  }

  if (admin.department === 'health') {
    return '/admin/services/health'
  }

  if (admin.department === 'food_grocery') {
    return '/admin/services/food-grocery'
  }

  if (admin.department === 'university_supplies') {
    return '/admin/services/university-supplies'
  }

  if (admin.department === 'co_working_spaces') {
    return '/admin/services/co-working-spaces'
  }

  if (admin.department === 'community') {
    return '/admin/community/posts'
  }

  if (admin.department === 'services') {
    return '/admin/services'
  }

  if (admin.department === 'career') {
    return '/admin/career'
  }

  if (admin.department === 'properties') {
    return '/admin/properties'
  }

  return '/admin/unauthorized'
}

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      setLoading(false)
      setErrorMessage(error?.message || 'Login failed')
      return
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role, department, is_active, owner_id')
      .eq('id', data.user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (adminError || !adminUser) {
      setLoading(false)
      setErrorMessage('This account is not authorized as an admin.')
      return
    }

    const redirectPath = await getDefaultAdminRoute(supabase, adminUser)

    setLoading(false)
    router.push(redirectPath)
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-white text-gray-700 relative">
      <header className="border-b border-gray-200 bg-[#f7f7f7] sticky top-0 md:static z-40 shadow-sm md:shadow-none h-20">
        <div className="mx-auto max-w-[1920px] px-4 h-full">
          <div className="flex items-center justify-center h-full">
            <Link
              href="/properties"
              className="flex items-center justify-center overflow-hidden h-full"
            >
              <img
                src="https://i.ibb.co/QFk5dY1G/Navienty-1.png"
                alt="Logo"
                style={{
                  height: '180%',
                  width: 'auto',
                  objectFit: 'contain',
                  transform: 'scale(1)',
                  display: 'block',
                }}
              />
            </Link>
          </div>
        </div>
      </header>

      <section className="flex min-h-[calc(100vh-120px)] items-center justify-center px-6 py-10 bg-[#fcfcfd]">
        <div className="w-full flex justify-center">
          <form onSubmit={handleLogin} className="form">
            <div id="login-area">
              <p>LOGIN</p>
              <p id="behind">Log in to your account</p>
            </div>

            <div id="email-area">
              <input
                placeholder="EMAIL"
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div id="password-area">
              <input
                placeholder="PASSWORD"
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div id="footer-area">
              <button type="submit" disabled={loading}>
                {loading ? 'Authenticating...' : 'Log In'}
              </button>

              {errorMessage && (
                <div className="error-box">
                  {errorMessage.includes('email')
                    ? 'Invalid email or password. Please try again.'
                    : errorMessage}
                </div>
              )}
            </div>

            <div id="background-color" />

            <div id="link-circle">
              <a
                href="https://www.facebook.com/navienty"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={35} height={35} viewBox="0 0 24 24" fill="#2563eb">
                  <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm4 7.278V4.5h-2.286c-2.1 0-3.428 1.6-3.428 3.889v1.667H8v2.777h2.286V19.5h2.857v-6.667h2.286L16 10.056h-2.857V8.944c0-1.11.572-1.666 1.714-1.666H16z" />
                </svg>
              </a>

              <a
                href="https://www.instagram.com/navienty"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={35} height={35} viewBox="0 0 24 24" fill="#2563eb">
                  <path d="M12 0c6.6274 0 12 5.3726 12 12s-5.3726 12-12 12S0 18.6274 0 12 5.3726 0 12 0zm3.115 4.5h-6.23c-2.5536 0-4.281 1.6524-4.3805 4.1552L4.5 8.8851v6.1996c0 1.3004.4234 2.4193 1.2702 3.2359.7582.73 1.751 1.1212 2.8818 1.1734l.2633.006h6.1694c1.3004 0 2.389-.4234 3.1754-1.1794.762-.734 1.1817-1.7576 1.2343-2.948l.0056-.2577V8.8851c0-1.2702-.4234-2.3589-1.2097-3.1452-.7338-.762-1.7575-1.1817-2.9234-1.2343l-.252-.0056zM8.9152 5.8911h6.2299c.9072 0 1.6633.2722 2.2076.8166.4713.499.7647 1.1758.8103 1.9607l.0063.2167v6.2298c0 .9375-.3327 1.6936-.877 2.2077-.499.4713-1.176.7392-1.984.7806l-.2237.0057H8.9153c-.9072 0-1.6633-.2722-2.2076-.7863-.499-.499-.7693-1.1759-.8109-2.0073l-.0057-.2306V8.885c0-.9073.2722-1.6633.8166-2.2077.4712-.4713 1.1712-.7392 1.9834-.7806l.2242-.0057h6.2299-6.2299zM12 8.0988c-2.117 0-3.871 1.7238-3.871 3.871A3.8591 3.8591 0 0 0 12 15.8408c2.1472 0 3.871-1.7541 3.871-3.871 0-2.117-1.754-3.871-3.871-3.871zm0 1.3911c1.3609 0 2.4798 1.119 2.4798 2.4799 0 1.3608-1.119 2.4798-2.4798 2.4798-1.3609 0-2.4798-1.119-2.4798-2.4798 0-1.361 1.119-2.4799 2.4798-2.4799zm4.0222-2.3589a.877.877 0 1 0 0 1.754.877.877 0 0 0 0-1.754z" />
                </svg>
              </a>

              <a
                href="https://www.linkedin.com/company/navienty/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={35} height={35} viewBox="0 0 24 24" fill="#2563eb">
                  <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zM8.951 9.404H6.165V17.5H8.95V9.404zm6.841-.192c-1.324 0-1.993.629-2.385 1.156l-.127.181V9.403h-2.786l.01.484c.006.636.007 1.748.005 2.93l-.015 4.683h2.786v-4.522c0-.242.018-.484.092-.657.202-.483.66-.984 1.43-.984.955 0 1.367.666 1.408 1.662l.003.168V17.5H19v-4.643c0-2.487-1.375-3.645-3.208-3.645zM7.576 5.5C6.623 5.5 6 6.105 6 6.899c0 .73.536 1.325 1.378 1.392l.18.006c.971 0 1.577-.621 1.577-1.398C9.116 6.105 8.53 5.5 7.576 5.5z" />
                </svg>
              </a>
            </div>
          </form>
        </div>
      </section>

      <style jsx>{`
        .form {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: white;
          width: clamp(20rem, 32vw, 25rem);
          min-height: 30rem;
          border: 2px solid #1e40af;
          border-bottom-left-radius: 1.8em;
          border-top-right-radius: 1.8em;
          box-shadow:
            -10px 0px 0px #1e40af,
            -10px 7px 10px rgb(0, 0, 0, 0.18);
          overflow: hidden;
          position: relative;
          transition: all 0.25s ease;
          padding-bottom: 0.8rem;
        }

        #login-area,
        #email-area,
        #password-area,
        #footer-area {
          position: relative;
          z-index: 2;
        }

        #login-area {
          width: 100%;
          height: 4.6em;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
        }

        #login-area p {
          top: 0.45em;
          font-size: 1.7em;
          font-weight: bold;
          position: absolute;
          z-index: 2;
          margin: 0;
        }

        #login-area #behind {
          top: 62%;
          font-size: 0.95em;
          font-weight: bold;
          position: absolute;
          z-index: 1;
        }

        #behind {
          position: absolute;
          left: 1.2em;
          color: #2563eb;
        }

        #email-area {
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          height: 6em;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          margin-top: 1em;
          transition: all 0.25s ease;
        }

        #email-area input {
          width: 100%;
          border: 2px solid #2563eb;
          border-radius: 0.65em;
          height: 3em;
          padding-left: 1em;
          font-size: 0.95rem;
          font-weight: 100;
          transition: all 0.5s ease;
          outline: none;
          box-shadow: 0px 5px 5px -3px rgb(0, 0, 0, 0.2);
          box-sizing: border-box;
          position: relative;
          z-index: 3;
        }

        #password-area {
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          height: 6.8em;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          flex-direction: column;
          transition: all 0.25s ease;
        }

        #password-area input {
          width: 100%;
          border: 2px solid #2563eb;
          font-size: 0.95rem;
          border-radius: 0.65em;
          height: 3em;
          padding-left: 1em;
          transition: all 0.25s ease;
          outline: none;
          box-shadow: 0px 5px 5px -3px rgb(0, 0, 0, 0.2);
          box-sizing: border-box;
          position: relative;
          z-index: 3;
        }

        #password-area a {
          padding-top: 0.7em;
          font-size: 0.84em;
          font-weight: bold;
          transition: all 0.25s ease;
          color: #2563eb;
          text-decoration: none;
        }

        #footer-area {
          margin-top: 0%;
          padding-top: 0.3em;
          width: 100%;
          padding-left: 10%;
          padding-right: 10%;
          min-height: 9em;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          color: #2563eb;
          transition: all 0.25s ease;
        }

        #footer-area button {
          width: 100%;
          border: 2px solid #2563eb;
          border-radius: 0.65em;
          height: 3em;
          padding-left: 1em;
          font-size: 0.95rem;
          transition: all 0.25s ease;
          color: white;
          font-weight: bold;
          background-color: #2563eb;
          box-shadow: 0px 5px 5px -3px rgb(0, 0, 0, 0.2);
          cursor: pointer;
          box-sizing: border-box;
        }

        #footer-area p,
        #footer-area a {
          font-size: 0.84em;
          transition: all 0.25s ease;
          margin: 0;
          text-decoration: none;
          color: inherit;
        }

        #text-inside {
          padding-top: 0.8em;
          display: flex;
          gap: 0.2em;
        }

        #link {
          padding-left: 0.1em;
          font-weight: bold;
        }

        #background-color {
          width: 100%;
          height: 4.6em;
          background-color: #2563eb;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
          transition:
            top 0.35s ease,
            height 0.35s ease;
          box-shadow: inset 5px 0px #1e40af;
          pointer-events: none;
        }

        #link-circle {
          width: 100%;
          height: 5em;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding-left: 15%;
          padding-right: 15%;
          margin-top: auto;
        }

        #link-circle svg {
          transition: all 0.25s ease;
        }

        ::placeholder {
          color: #2563eb;
          font-weight: bold;
        }

        .form:hover {
          width: clamp(20.3rem, 33vw, 25.5rem);
          min-height: 30.5rem;
        }

        #email-area:hover ~ #background-color {
          top: 5.6em;
          height: 6em;
        }

        #password-area:hover ~ #background-color {
          top: 11.6em;
          height: 6.8em;
        }

        #footer-area:hover ~ #background-color {
          top: 18.4em;
          height: 9em;
        }

        #email-area:hover,
        #password-area:hover,
        #footer-area:hover {
          padding-left: 7%;
          padding-right: 7%;
        }

        #email-area:hover p {
          color: white;
        }

        #email-area:hover input {
          color: white;
          border: 2px solid white;
          background-color: #2563eb;
          height: 3.2em;
        }

        #email-area:hover ::placeholder {
          color: white;
        }

        #password-area:hover p {
          color: white;
        }

        #password-area:hover a {
          color: white;
          padding-right: 5%;
        }

        #password-area:hover input {
          color: white;
          border: 2px solid white;
          background-color: #2563eb;
          height: 3.2em;
        }

        #password-area:hover ::placeholder {
          color: white;
        }

        #footer-area:hover p,
        #footer-area:hover a {
          color: white;
        }

        #footer-area:hover button {
          border: 2px solid white;
          background-color: #2563eb;
          height: 3.2em;
        }

        #footer-area button:active {
          color: #2563eb;
          background-color: white;
          width: 95%;
        }

        #link-circle svg:hover {
          transform: scale(1.15);
          margin: 0.3em;
        }

        .error-box {
          margin-top: 0.75em;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 0.75em 0.85em;
          border-radius: 0.6em;
          font-size: 0.8em;
          width: 100%;
          border: 1px solid #bfdbfe;
          text-align: center;
          box-sizing: border-box;
        }

        @media (max-width: 640px) {
          .form {
            width: min(90vw, 22rem);
            min-height: 29rem;
            box-shadow:
              -8px 0px 0px #1e40af,
              -8px 6px 10px rgb(0, 0, 0, 0.16);
          }

          .form:hover {
            width: min(90vw, 22rem);
            min-height: 29rem;
          }

          #login-area p {
            font-size: 1.55em;
          }

          #login-area #behind {
            font-size: 0.88em;
          }

          #email-area:hover ~ #background-color {
            top: 5.6em;
            height: 6em;
          }

          #password-area:hover ~ #background-color {
            top: 11.6em;
            height: 6.8em;
          }

          #footer-area:hover ~ #background-color {
            top: 18.4em;
            height: 9em;
          }
        }
      `}</style>
    </main>
  )
}