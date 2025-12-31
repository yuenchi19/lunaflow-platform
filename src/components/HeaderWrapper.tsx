"use client";

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function HeaderWrapper() {
    const pathname = usePathname();

    // Hide header on admin pages, community pages, and login page (root)
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/community') || pathname === '/') {
        return null;
    }

    return <Header />;
}
