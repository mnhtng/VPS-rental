"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { LanguageBadge } from '@/components/ui/language-badge';
import { AnimatedCloudIcon } from '@/components/custom/icon/animated-cloud-icon';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { HelpCircle, LogOut, Package, Shield, Loader, Home, Server, Aperture, User } from "lucide-react"
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";


const ClientHeader = () => {
    const { data: session } = useSession()
    const locale = useLocale()
    const { logout } = useAuth();
    const t = useTranslations("header")

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const mainNavigation = [
        { name: t('home'), href: `/${locale}`, icon: Home },
        { name: t('plans'), href: `/${locale}/plans`, icon: Server },
        { name: t('support'), href: `/${locale}/support`, icon: HelpCircle },
    ];

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            toast.success(t('logout_success'));
        } catch {
            toast.error(t('logout_failed'), {
                description: t('try_again'),
            });
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="flex items-center justify-between border-b px-4 md:px-6 py-4 bg-white dark:bg-slate-950 shrink-0">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <ThemeSwitcher />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <LanguageBadge />

                <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                        <AnimatedCloudIcon size={36} />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {session?.user?.name || t('default_user')}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {session?.user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        {mainNavigation.map((item) => (
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

                        <>
                            <DropdownMenuSeparator />

                            {session?.user?.role === 'ADMIN' && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/${locale}/admin`} className="flex items-center">
                                        <Shield className="mr-2 h-4 w-4" />
                                        {t('admin')}
                                    </Link>
                                </DropdownMenuItem>
                            )}
                        </>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                            {isLoggingOut ? (
                                <>
                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                    {t('logging_out')}
                                </>
                            ) : (
                                <>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {t('logout')}
                                </>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}

export default ClientHeader
