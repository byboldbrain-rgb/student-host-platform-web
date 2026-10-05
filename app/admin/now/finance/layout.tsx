import type { ReactNode } from 'react';

import FinanceNav from './components/finance-nav';
import { requireFinanceAdmin } from './lib/finance-data';

export default async function FinanceLayout({ children }: { children: ReactNode }) {
  await requireFinanceAdmin();

  return (
    <div className="space-y-5">
      <FinanceNav />
      {children}
    </div>
  );
}
