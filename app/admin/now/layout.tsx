import type { ReactNode } from 'react';

import NowAdminShell from './components/admin-shell';
import { requireNowAdmin } from './lib/admin-data';

export default async function NavientyNowAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { access } = await requireNowAdmin();

  return <NowAdminShell access={access}>{children}</NowAdminShell>;
}
