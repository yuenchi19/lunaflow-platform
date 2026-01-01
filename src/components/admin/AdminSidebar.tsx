"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminLayout.module.css';

// Mock icons would typically be imported here
// For now we use text/emoji as placeholders or simple spans

export default function AdminSidebar() {
    const pathname = usePathname();

    const menuSections = [
        {
            label: "ホーム",
            items: [
                { label: "ホーム", href: "/admin/dashboard", icon: "🏠" },
                { label: "Community", href: "/community", icon: "💬" },
            ]
        },
        {
            label: "コース",
            items: [
                { label: "コース", href: "/admin/courses", icon: "📚" },
            ]
        },
        {
            label: "管理",
            items: [
                { label: "スタッフ", href: "/admin/staff", icon: "👥" },
                { label: "受講生", href: "/admin/students", icon: "🎓" },
                { label: "アフィリエイト", href: "/admin/affiliates", icon: "🤝" },
                { label: "在庫管理 (Master)", href: "/admin/inventory", icon: "👜" },
                { label: "仕入れ希望", href: "/admin/purchase-requests", icon: "📦" },
                { label: "感想", href: "/admin/feedback", icon: "💬" },
                { label: "お知らせ", href: "/admin/news", icon: "📢" },
            ]
        },
        {
            label: "設定",
            items: [
                { label: "設定", href: "/admin/settings", icon: "⚙️" },
                { label: "メール配信設定", href: "/admin/settings/email", icon: "📧" },
                { label: "コミュニティ設定", href: "/admin/settings/community", icon: "💬" },
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
                        {section.label !== "ホーム" && section.label !== "コース" && (
                            <div className={styles.sectionHeader}>
                                {section.label}
                                <span className={styles.arrow}>⌄</span>
                            </div>
                        )}
                        <div className={styles.sectionItems}>
                            {section.items.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`${styles.menuItem} ${pathname === item.href ? styles.menuItemActive : ""}`}
                                >
                                    <span className={styles.icon}>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

            </nav>
        </aside>
    );
}

