"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './AdminLayout.module.css';

// Mock icons would typically be imported here
// For now we use text/emoji as placeholders or simple spans

export default function AdminSidebar() {
    const pathname = usePathname();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                // We'll assume the list API returns a list, and we can filter or count
                // Or better, create a specific count endpoint. For now, let's fetch list and count pending.
                // Optimally this should be an SWR or react-query hook, but useEffect is fine for now.
                const res = await fetch('/api/admin/purchase-requests');
                if (res.ok) {
                    const data = await res.json();
                    const pending = data.filter((req: any) => req.status === 'pending').length;
                    setPendingCount(pending);
                }
            } catch (error) {
                console.error("Failed to fetch notification count", error);
            }
        };

        fetchPendingCount();
        // Poll every minute? Or just once on mount. 
        // Let's stick to mount for now to be safe.
    }, []);

    // State for collapsible sections (defaulting all to open initially, or specific ones?)
    // User asked "Arrow click hides content", implying they want toggle.
    // Let's default all to OPEN.
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        "ホーム": true,
        "メイン": true,
        "管理": true,
        "商品管理": true,
        "設定": true
    });

    const toggleSection = (label: string) => {
        setOpenSections(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const menuSections = [
        {
            label: "ホーム", // Home usually doesn't toggle if it has no header, but ours does?
            items: [
                { label: "ホーム", href: "/admin/dashboard", icon: "🏠" },
            ]
        },
        {
            label: "メイン",
            items: [
                { label: "コース", href: "/admin/courses", icon: "📚" },
                { label: "コミュニティ", href: "/community", icon: "💬" },
                { label: "感想・課題", href: "/admin/feedback", icon: "📝" },
            ]
        },
        {
            label: "管理",
            items: [
                { label: "スタッフ", href: "/admin/staff", icon: "👥" },
                { label: "受講生", href: "/admin/students", icon: "🎓" },
                { label: "アフィリエイト", href: "/admin/affiliates", icon: "🤝" },
                { label: "報酬管理", href: "/admin/payouts", icon: "💰" },
            ]
        },
        {
            label: "商品管理",
            items: [
                { label: "在庫管理", href: "/admin/inventory", icon: "👜" },
                { label: "仕入れ希望", href: "/admin/purchase-requests", icon: "📦", badge: pendingCount },
                { label: "商品管理", href: "/admin/inventory/products", icon: "🏷️" },
            ]
        },
        {
            label: "設定",
            items: [
                { label: "アカウント設定", href: "/admin/settings/account", icon: "⚙️" },
                { label: "メール配信設定", href: "/admin/settings/email", icon: "📧" },
                { label: "コミュニティ設定", href: "/admin/settings/community", icon: "💬" },
                { label: "機能開放設定", href: "/admin/settings/unlocks", icon: "🔓" },
                { label: "LINE通知設定", href: "/admin/settings/line", icon: "📱" },
            ]
        }
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.brand}>
                <img src="/logo.png" alt="LunaFlow" className={styles.logoImage} style={{ height: '48px' }} />
            </div>
            <nav className={styles.menu}>
                {menuSections.map((section) => (
                    <div key={section.label} className={styles.menuSection}>
                        {/* Always show header if not Home/Courses? User said arrow click. */
                            /* Actually user logic: "Main -> Arrow -> Contents". */
                            /* Previous logic hid headers for Home/Courses. */
                            /* Let's show headers for ALL except maybe Home if it only has 1 item and no arrow? */
                            /* Request: "Arrow click -> Hide". So every section with items should be collapsible. */
                        }

                        <div
                            className={`${styles.sectionHeader} cursor-pointer hover:bg-slate-100/5 transition-colors select-none flex justify-between items-center pr-4`}
                            onClick={() => toggleSection(section.label)}
                        >
                            <span className="font-bold">{section.label}</span>
                            <span className={`transform transition-transform duration-200 ${openSections[section.label] ? 'rotate-0' : '-rotate-90'}`}>
                                ⌄
                            </span>
                        </div>

                        <div
                            className={`${styles.sectionItems} overflow-hidden transition-all duration-300 ease-in-out`}
                            style={{
                                maxHeight: openSections[section.label] ? '500px' : '0',
                                opacity: openSections[section.label] ? 1 : 0
                            }}
                        >
                            {section.items.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`${styles.menuItem} ${pathname === item.href ? styles.menuItemActive : ""}`}
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <span className={styles.icon}>{item.icon}</span>
                                        <span>{item.label}</span>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

            </nav>
        </aside>
    );
}
