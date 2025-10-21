"use client"

import {
    Users,
    FileText,
    MessageSquare,
    LayoutDashboardIcon,
    BotIcon,
    BarChart3
} from 'lucide-react'
import {
    ChevronSidebarTrigger,
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from "@/components/ui/sidebar"
import { NavMain } from '@/components/custom/admin/cms-nav-main'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { usePathname } from 'next/navigation'
import { AdminNavUser } from '@/components/custom/admin/cms-nav-user'

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
        title: 'Articles',
        url: '/admin/articles',
        icon: FileText,
        color: 'purple',
    },
    {
        title: 'Chats',
        url: '/admin/chats',
        icon: MessageSquare,
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
                    <div className="flex items-center w-full h-full p-2 text-foreground">
                        <BotIcon size={40} stroke='#8497FD' />

                        <Separator orientation="vertical" className="mx-2" />

                        <div className="flex flex-col items-start justify-center w-full h-full">
                            <h1 className="text-xl font-semibold">AI Assistant</h1>
                            <p className="text-sm text-muted-foreground">ChatBot CMS</p>
                        </div>
                    </div>
                ) : (
                    <Link
                        href="/admin"
                        className="flex items-center justify-center w-full h-full p-1 text-foreground cursor-pointer"
                        title="ChatBot CMS"
                        aria-label="ChatBot CMS"
                    >
                        <BotIcon stroke='#8497FD' />
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