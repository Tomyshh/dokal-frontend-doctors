import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import DashboardLayoutClient from './DashboardLayoutClient';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
