'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // Don't show header in admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  
  return <Header />;
}

