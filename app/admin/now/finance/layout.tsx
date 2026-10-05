import type { ReactNode } from 'react';

import FinanceNav from './components/finance-nav';
import { requireFinanceAdmin } from './lib/finance-data';

export default async function FinanceLayout({ children }: { children: ReactNode }) {
  await requireFinanceAdmin();

  return (
    <div className="-mt-6 space-y-0 md:-mt-8 lg:-mt-8">
      <FinanceNav />
      <div className="pt-6 md:pt-8">{children}</div>
    </div>
  );
}
