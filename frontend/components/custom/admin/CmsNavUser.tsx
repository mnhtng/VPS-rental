"use client"

import {
    Aperture,
    ChevronsUpDown,
    Cloud,
    HelpCircle,
    Home,
    Loader,
    LogOut,
    Package,
    Server,
    User,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"
import { useLocale, useTranslations } from "next-intl"
import { useAuth } from '@/contexts/AuthContext';
import Link from "next/link"
import { AnimatedThemeToggler } from "@/components/theme/animated-theme-toggler"
import { LanguageBadge } from "@/components/ui/language-badge"

export function AdminNavUser() {
    const locale = useLocale()
    const { isMobile, open } = useSidebar()
    const { data: session } = useSession()
    const t = useTranslations('header')
    const tAdmin = useTranslations('admin.nav')
    const { logout } = useAuth()

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navigation = [
        { name: t('home'), href: `/${locale}`, icon: Home },
        { name: t('plans'), href: `/${locale}/plans`, icon: Server },
        { name: t('support'), href: `/${locale}/support`, icon: HelpCircle },
    ]

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            toast.success(t('logout'));
        } catch {
            toast.error(t('logout'));
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <div className={`flex items-center justify-between gap-4 px-4 py-2 ${open ? 'flex-row' : 'flex-col'}`}>
                    <AnimatedThemeToggler />

                    <LanguageBadge minimal={open ? false : true} />
                </div>

                <DropdownMenu modal={isMobile ? true : false}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                {session?.user?.image ? (
                                    <Image
                                        src={session?.user?.image}
                                        alt={session?.user?.name || ''}
                                        width={32}
                                        height={32}
                                        priority={false}
                                        quality={80}
                                        placeholder="blur"
                                        blurDataURL="/avatar/user.png"
                                    />
                                ) : (
                                    <AvatarFallback className="rounded-lg">
                                        {session?.user.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                )}
                            </Avatar>

                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{session?.user?.name}</span>
                                <span className="truncate text-xs">{session?.user?.email}</span>
                            </div>

                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    {session?.user?.image ? (
                                        <Image
                                            src={session?.user?.image}
                                            alt={session?.user?.name || ''}
                                            width={32}
                                            height={32}
                                            priority={false}
                                            quality={80}
                                            placeholder="blur"
                                            blurDataURL="/avatar/user.png"
                                        />
                                    ) : (
                                        <AvatarFallback className="rounded-lg">
                                            {session?.user.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{session?.user?.name}</span>
                                    <span className="truncate text-xs">{session?.user?.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        {navigation.map((item) => (
                            <DropdownMenuItem asChild key={item.name}>
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center"
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.name}
                                </Link>
                            </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                            <Link href={`/${locale}/profile`} className="flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                {t('profile')}
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                            <Link href={`/${locale}/my-orders`} className="flex items-center">
                                <Package className="mr-2 h-4 w-4" />
                                {t('my_orders')}
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                            <Link href={`/${locale}/my-tickets`} className="flex items-center">
                                <Aperture className="mr-2 h-4 w-4" />
                                {t('my_tickets')}
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                            <Link href={`/${locale}/client-dashboard`} className="flex items-center">
                                <Cloud className="mr-2 h-4 w-4" />
                                {t('manage_vps')}
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="cursor-pointer px-2.5"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            <LogOut stroke="red" />
                            <span className={`text-red-500 ${isLoggingOut ? 'opacity-70 flex items-center' : ''}`}>
                                {isLoggingOut ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        {tAdmin('logging_out')}
                                    </>
                                ) : (
                                    <>
                                        {t('logout')}
                                    </>
                                )}
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
