"use client"

import {
    Users,
    LayoutDashboardIcon,
    BarChart3,
    MonitorCog,
    WalletCards,
    Headset,
    Layers
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
import { useLocale } from 'next-intl'

const menuItems = [
    {
        title: 'Dashboard',
        url: '/admin',
        icon: LayoutDashboardIcon,
        color: 'blue',
    },
    {
        title: 'Users',
        url: '/admin/users',
        icon: Users,
        color: 'green',
    },
    {
        title: 'VPS',
        url: '/admin/vps',
        icon: MonitorCog,
        color: 'purple',
    },
    {
        title: 'Plans',
        url: '/admin/plans',
        icon: Layers,
        color: 'indigo',
    },
    {
        title: 'Support',
        url: '/admin/support',
        icon: Headset,
        color: 'cyan',
    },
    {
        title: 'Revenue',
        url: '/admin/revenue',
        icon: WalletCards,
        color: 'orange',
    },
    {
        title: 'Analytics',
        url: '/admin/analytics',
        icon: BarChart3,
        color: 'red',
    }
]


export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const locale = useLocale()
    const { isMobile, open } = useSidebar()
    const pathname = usePathname()

    const menuItemsWithActive = menuItems.map(item => ({
        ...item,
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
                            <p className="text-sm text-muted-foreground">Admin Panel</p>
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
                                title="Toggle Sidebar"
                                aria-label="Toggle Sidebar"
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