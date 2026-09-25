import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCurrentUser } from '@/api/auth'
import { AdminBar } from '@/components/admin/AdminBar'
import { ToastProvider } from '@/components/ui'

/**
 * Layout for everything under /admin. Client-rendered (ssr: false) so the
 * Worker spends CPU only on data calls, not on rendering admin pages.
 * Server functions enforce auth independently via `requireAdmin`. Admin
 * pages show their notices and errors as toasts from the one provider here.
 */
export const Route = createFileRoute('/admin')({
  ssr: false,
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) throw redirect({ to: '/login' })
    return { user }
  },
  head: () => ({ meta: [{ title: 'Admin' }] }),
  component: AdminLayout,
})

function AdminLayout() {
  const { user } = Route.useRouteContext()
  return (
    <ToastProvider>
      <AdminBar user={user} />
      <Outlet />
    </ToastProvider>
  )
}
