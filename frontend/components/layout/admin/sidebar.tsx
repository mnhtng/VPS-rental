"use client"

import {
    Users,
    LayoutDashboardIcon,
    BarChart3,
    MonitorCog,
    WalletCards,
    Headset,
    Layers,
    LucideIcon
} from 'lucide-react'
import {
    ChevronSidebarTrigger,
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from "@/components/ui/sidebar"
import { NavMain } from '@/components/custom/admin/CmsNavMain'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { usePathname } from 'next/navigation'
import { AdminNavUser } from '@/components/custom/admin/CmsNavUser'
import { useLocale, useTranslations } from 'next-intl'

interface MenuItem {
    titleKey: string
    url: string
    icon: LucideIcon
    color: string
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const locale = useLocale()
    const t = useTranslations('admin.sidebar')
    const tPages = useTranslations('admin.pages')
    const { isMobile, open } = useSidebar()
    const pathname = usePathname()

    const menuItems: MenuItem[] = [
        {
            titleKey: 'dashboard',
            url: `${locale === 'vi' ? '/vi' : ''}/admin`,
            icon: LayoutDashboardIcon,
            color: 'blue',
        },
        {
            titleKey: 'users',
            url: `${locale === 'vi' ? '/vi' : ''}/admin/users`,
            icon: Users,
            color: 'green',
        },
        {
            titleKey: 'vps',
            url: `${locale === 'vi' ? '/vi' : ''}/admin/vps`,
            icon: MonitorCog,
            color: 'purple',
        },
        {
            titleKey: 'plans',
            url: `${locale === 'vi' ? '/vi' : ''}/admin/plans`,
            icon: Layers,
            color: 'indigo',
        },
        {
            titleKey: 'support',
            url: `${locale === 'vi' ? '/vi' : ''}/admin/support`,
            icon: Headset,
            color: 'cyan',
        },
        {
            titleKey: 'revenue',
            url: `${locale === 'vi' ? '/vi' : ''}/admin/revenue`,
            icon: WalletCards,
            color: 'orange',
        },
        {
            titleKey: 'analytics',
            url: `${locale === 'vi' ? '/vi' : ''}/admin/analytics`,
            icon: BarChart3,
            color: 'red',
        }
    ]

    const menuItemsWithActive = menuItems.map(item => ({
        title: tPages(`${item.titleKey}.title`),
        url: item.url,
        icon: item.icon,
        color: item.color,
        isActive: pathname === item.url
    }))

    return (
        <Sidebar
            collapsible="icon"
            variant='floating'
            {...props}
        >
            <SidebarHeader>
                {open || isMobile ? (
                    <div className="hidden md:flex items-center w-full h-full p-2 text-foreground">
                        <Link href={`/${locale}/admin`} className="flex items-center space-x-2 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="h-13 w-13"
                            />
                        </Link>

                        <Separator orientation="vertical" className="mx-2" />

                        <div className="flex flex-col items-start justify-center w-full h-full">
                            <h1 className="text-xl font-semibold">PCloud</h1>
                            <p className="text-sm text-muted-foreground">{t('admin_panel')}</p>
                        </div>
                    </div>
                ) : (
                    <Link
                        href={`/${locale}/admin`}
                        className="flex items-center space-x-2 shrink-0 cursor-pointer"
                        title="PCloud Admin Panel"
                        aria-label="PCloud Admin Panel"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="h-7 w-7"
                        />
                    </Link>
                )}

                <Separator className="relative">
                    {!isMobile && (
                        <div className={`absolute -right-6 -top-4 z-100`}>
                            <ChevronSidebarTrigger
                                className="w-8 h-8 rounded-full bg-accent-foreground text-background transition-colors duration-200 flex items-center justify-center hover:bg-accent-foreground hover:text-background dark:hover:bg-accent-foreground"
                                title={t('toggle_sidebar')}
                                aria-label={t('toggle_sidebar')}
                            />
                        </div>
                    )}
                </Separator>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={menuItemsWithActive} />
            </SidebarContent>

            <SidebarFooter>
                <AdminNavUser />
            </SidebarFooter>
        </Sidebar>
    )
} 