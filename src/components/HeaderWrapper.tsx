"use client";

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function HeaderWrapper() {
    const pathname = usePathname();

    // Hide header on admin pages and community pages (to prevent double menu on mobile)
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/community')) {
        return null;
    }

    return <Header />;
}
