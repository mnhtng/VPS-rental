"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Server, CreditCard, Settings, LifeBuoy, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useLocale, useTranslations } from "next-intl"

const ClientSidebar = () => {
    const pathname = usePathname()
    const locale = useLocale()
    const { setOpenMobile } = useSidebar()
    const t = useTranslations("sidebar")

    const routes = [
        {
            label: t('dashboard'),
            icon: LayoutDashboard,
            href: "/client-dashboard",
            color: "text-sky-500",
        },
        {
            label: t('vps'),
            icon: Server,
            href: "/client-dashboard/vps",
            color: "text-violet-500",
        },
        {
            label: t('billing'),
            icon: CreditCard,
            href: "/client-dashboard/billing",
            color: "text-pink-700",
        }
    ]

    const bottomRoutes = [
        {
            label: t('support'),
            icon: LifeBuoy,
            href: "/support",
            color: "text-orange-500",
        },
    ]

    const handleLinkClick = () => {
        setOpenMobile(false)
    }

    return (
        <Sidebar className="border-r border-slate-800 bg-slate-900 text-white">
            <SidebarHeader className="px-3 py-6">
                <Link href={`/${locale}/client-dashboard`} className="flex items-center pl-3" onClick={handleLinkClick}>
                    <div className="relative w-13 h-13 mr-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-8 h-8 md:h-13 md:w-13"
                        />
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {routes.map((route) => (
                                <SidebarMenuItem key={route.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === route.href || (route.href !== "/client-dashboard" && pathname?.startsWith(route.href))}
                                        tooltip={route.label}
                                        className={cn(
                                            "h-11 text-zinc-400 hover:text-white hover:bg-white/10",
                                            (pathname === route.href || (route.href !== "/client-dashboard" && pathname?.startsWith(route.href))) && "text-white bg-white/10"
                                        )}
                                    >
                                        <Link href={route.href} onClick={handleLinkClick}>
                                            <route.icon className={cn("h-5 w-5", route.color)} />
                                            <span>{route.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="px-3 py-2">
                <SidebarMenu>
                    {bottomRoutes.map((route) => (
                        <SidebarMenuItem key={route.href} className="hidden md:block">
                            <SidebarMenuButton
                                asChild
                                tooltip={route.label}
                                className="h-11 text-zinc-400 hover:text-white hover:bg-white/10"
                            >
                                <Link href={route.href} onClick={handleLinkClick}>
                                    <route.icon className={cn("h-5 w-5", route.color)} />
                                    <span>{route.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

export default ClientSidebar
