"use client"

import {
    ChevronsUpDown,
    LogOut,
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
import { logout } from "@/utils/auth"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { ThemeSwitcherDropdown } from '@/components/custom/theme/theme-switcher-dropdown'

export function AdminNavUser() {
    const { isMobile } = useSidebar()

    const { data: session } = useSession()

    const onLogout = async () => {
        await logout()
        window.location.href = "/"
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
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
                                        US
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
                                            US
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

                        <DropdownMenuItem className="p-0">
                            <ThemeSwitcherDropdown className="w-full flex items-center justify-start font-normal">
                                Theme
                            </ThemeSwitcherDropdown>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="cursor-pointer px-[10px]"
                            onClick={onLogout}
                        >
                            <LogOut stroke="red" />
                            <span className="text-red-500">
                                Log out
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
