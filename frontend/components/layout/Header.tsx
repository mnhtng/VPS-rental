'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Server,
    ShoppingCart,
    User,
    LogOut,
    Menu,
    Shield,
    HelpCircle,
    Package,
    Home,
    KeyRound,
    UserRoundPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { LanguageBadge } from '@/components/ui/language-badge';
import { Separator } from '@radix-ui/react-separator';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';

export const Header = () => {
    const { data: session } = useSession()
    const t = useTranslations('header');
    const locale = useLocale();
    const { logout } = useAuth();

    const [active, setActive] = useState<string>('');
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation = [
        { name: t('home'), href: `/${locale}`, icon: Home },
        { name: t('plans'), href: `/${locale}/plans`, icon: Server },
        { name: t('support'), href: `/${locale}/support`, icon: HelpCircle },
    ];

    useEffect(() => {
        const pathWithoutLocale = pathname.startsWith(`/${locale}`)
            ? pathname.substring(locale.length + 1)
            : pathname === '/' ? pathname.substring(1) : pathname;

        const newPath = `/${locale}${pathWithoutLocale}`;
        setActive(newPath);
    }, [locale, pathname]);

    const handleLogout = async () => {
        setMobileMenuOpen(false);
        await logout();
    };

    return (
        <header className="bg-background shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href={`/${locale}`} className="flex items-center space-x-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="h-8 w-8 sm:h-13 sm:w-13"
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-5 lg:space-x-8">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setActive(item.href)}
                                className={cn(
                                    "text-muted-foreground/90 hover:text-muted-foreground px-3 py-2 text-sm font-medium transition-colors",
                                    active === item.href || (item.href !== `/${locale}` && (active as string).startsWith(item.href))
                                        ? "text-primary font-semibold hover:text-primary/80"
                                        : ""
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Right side actions */}
                    <div className="flex items-center">
                        {session && session.user ? (
                            <div className="hidden lg:flex items-center space-x-4">
                                {/* Cart */}
                                <Link href={`/${locale}/cart`} className="relative">
                                    <Button variant="ghost" size="sm" className="relative">
                                        <ShoppingCart className="h-5 w-5" />
                                        <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                            2
                                        </Badge>
                                    </Button>
                                </Link>

                                <Separator orientation="vertical" className="w-[1px] h-6 bg-accent/50" />

                                {/* Preferences */}
                                <ThemeSwitcher />
                                <LanguageBadge activeTab={setActive} />

                                <Separator orientation="vertical" className="w-[1px] h-6 bg-accent/50" />

                                {/* User */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-8 w-8 rounded-full hidden md:inline-flex">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={session.user.image || ''} />
                                                <AvatarFallback>
                                                    {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {session.user.name || 'User'}
                                                </p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {session.user.email}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>

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
                                                <HelpCircle className="mr-2 h-4 w-4" />
                                                {t('my_tickets')}
                                            </Link>
                                        </DropdownMenuItem>

                                        <>
                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem asChild>
                                                <Link href={`/${locale}/admin`} className="flex items-center">
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    {t('admin')}
                                                </Link>
                                            </DropdownMenuItem>
                                        </>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem onClick={handleLogout}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            {t('logout')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ) : (
                            <div className="hidden lg:flex items-center space-x-2">
                                <ThemeSwitcher />
                                <LanguageBadge activeTab={setActive} />

                                <Separator orientation="vertical" className="w-[1px] h-6 bg-accent/50" />

                                <Link href={`/${locale}/login`}>
                                    <Button variant="ghost" size="sm">
                                        {t('login')}
                                    </Button>
                                </Link>
                                <Link href={`/${locale}/register`}>
                                    <Button size="sm">
                                        {t('register')}
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Navigation */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="lg:hidden"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>

                            <SheetContent side="right">
                                <SheetHeader className="flex flex-row justify-between items-center gap-4 w-[85%]">
                                    <SheetTitle className='text-2xl'>
                                        {t('menu')}
                                    </SheetTitle>

                                    <div className="flex items-center justify-between gap-2">
                                        <ThemeSwitcher />
                                        <LanguageBadge activeTab={setActive} />
                                    </div>
                                </SheetHeader>

                                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 overflow-y-scroll">
                                    <SheetTitle className="mb-2">
                                        {t('nav')}
                                    </SheetTitle>

                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="hover:ml-2 block transition-all duration-200"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <Button variant="ghost" className="w-full justify-start">
                                                <item.icon className="mr-2 h-4 w-4" />
                                                {item.name}
                                            </Button>
                                        </Link>
                                    ))}

                                    {!session || !session.user ? (
                                        <>
                                            <Separator className="h-[1px] bg-accent/50 my-2" />

                                            <SheetTitle className="mb-2">
                                                {t('auth')}
                                            </SheetTitle>

                                            <Link
                                                href={`/${locale}/login`}
                                                className='hover:ml-2 block transition-all duration-200'
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <Button variant="ghost" className="w-full justify-start">
                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                    {t('login')}
                                                </Button>
                                            </Link>
                                            <Link
                                                href={`/${locale}/register`}
                                                className='hover:ml-2 block transition-all duration-200'
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <Button variant="ghost" className="w-full justify-start">
                                                    <UserRoundPlus className="mr-2 h-4 w-4" />
                                                    {t('register')}
                                                </Button>
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Separator className="h-[1px] bg-accent/50 my-2" />

                                            <SheetTitle className="mb-2">
                                                {t('acc')}
                                            </SheetTitle>

                                            <div className="space-y-1">
                                                <Link
                                                    href={`/${locale}/profile`}
                                                    className='hover:ml-2 block transition-all duration-200'
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    <Button variant="ghost" className="w-full justify-start">
                                                        <User className="mr-2 h-4 w-4" />
                                                        {t('profile')}
                                                    </Button>
                                                </Link>
                                                <Link
                                                    href={`/${locale}/orders`}
                                                    className='hover:ml-2 block transition-all duration-200'
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    <Button variant="ghost" className="w-full justify-start">
                                                        <Package className="mr-2 h-4 w-4" />
                                                        {t('my_orders')}
                                                    </Button>
                                                </Link>
                                                <Link
                                                    href={`/${locale}/my-tickets`}
                                                    className='hover:ml-2 block transition-all duration-200'
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    <Button variant="ghost" className="w-full justify-start">
                                                        <HelpCircle className="mr-2 h-4 w-4" />
                                                        {t('my_tickets')}
                                                    </Button>
                                                </Link>

                                                {session.user.role === 'ADMIN' && (
                                                    <Link
                                                        href={`/${locale}/admin`}
                                                        className='hover:ml-2 block transition-all duration-200'
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        <Button variant="ghost" className="w-full justify-start">
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            {t('admin')}
                                                        </Button>
                                                    </Link>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    className="hover:ml-2 transition-all duration-200 w-full justify-start"
                                                    onClick={handleLogout}
                                                >
                                                    <LogOut className="mr-2 h-4 w-4" />
                                                    {t('logout')}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
};
