"use client"

import { ChevronRight, LucideIcon } from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { colors } from "@/utils/color"
import { useTranslations } from "next-intl"

export const getColorClasses = (color: string) => {
    return colors[color as keyof typeof colors] || colors.blue
}

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
        isActive?: boolean
        color?: string
        items?: {
            title: string
            url: string
        }[]
    }[]
}) {
    const t = useTranslations('admin.nav')
    const { open } = useSidebar()

    const menuRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
    const navRef = useRef<HTMLUListElement>(null)

    const [indicatorStyle, setIndicatorStyle] = useState({
        top: 0,
        height: 0,
        opacity: 0
    })
    const [isAnimating, setIsAnimating] = useState(false)
    const activeItem = useMemo(() => {
        return items.find(item => item.isActive) || items[0]
    }, [items])
    const activeColorClasses = activeItem ? getColorClasses(activeItem.color as string) : getColorClasses("blue")

    useEffect(() => {
        const updateIndicator = () => {
            const activeElement = menuRefs.current[activeItem.title]
            const navElement = navRef.current

            if (activeElement && navElement) {
                const activeRect = activeElement.getBoundingClientRect()
                const navRect = navElement.getBoundingClientRect()

                const relativeTop = activeRect.top - navRect.top

                setIndicatorStyle({
                    top: relativeTop,
                    height: activeRect.height,
                    opacity: 1,
                })
            }
        }

        // Small delay to ensure DOM is ready
        const timer = setTimeout(updateIndicator, 50)
        return () => clearTimeout(timer)
    }, [activeItem.title])

    const handleMenuClick = (itemActive: string) => {
        if (itemActive !== activeItem.title) {
            setIsAnimating(true)

            // Reset animation state when the animation ends
            setTimeout(() => setIsAnimating(false), 300)
        }
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{t('main_menu')}</span>
                </div>
            </SidebarGroupLabel>

            <SidebarMenu ref={navRef} className="relative">
                {items.map((item) => (
                    item.items ? (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={item.isActive}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip={item.title}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton asChild>
                                                    <a href={subItem.url}>
                                                        <span>{subItem.title}</span>
                                                    </a>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    ) : (
                        <div key={item.title}>
                            <div
                                // Animated Sliding Indicator
                                className={cn(
                                    "absolute w-1 rounded-full transition-all duration-500 ease-out shadow-lg z-20",
                                    activeColorClasses.indicator,
                                    isAnimating && "scale-110",
                                    open ? "ml-2" : "ml-0",
                                )}
                                style={{
                                    top: isAnimating ? indicatorStyle.top + (indicatorStyle.height / 6) : indicatorStyle.top + (indicatorStyle.height / 4),
                                    height: isAnimating ? (indicatorStyle.height * 2 / 3) : indicatorStyle.height / 2,
                                    opacity: indicatorStyle.opacity,
                                    transform: `translateY(0px) ${isAnimating ? "scale(1.1)" : "scale(1)"}`,
                                }}
                            >
                            </div>

                            <div
                                // Background glow for active item
                                className={cn(
                                    "absolute w-full inset-0 rounded-md blur-sm transition-all duration-500 ease-out",
                                    activeColorClasses.glow,
                                )}
                                style={{
                                    top: indicatorStyle.top,
                                    height: indicatorStyle.height,
                                    opacity: indicatorStyle.opacity * 0.4,
                                }}
                            />

                            <SidebarMenuItem key={item.title} className="relative z-10">
                                <SidebarMenuButton asChild
                                    tooltip={item.title}
                                    ref={(el) => {
                                        menuRefs.current[item.title] = el
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 w-full",
                                        item.isActive
                                            ? `${getColorClasses(item.color as string).active} font-semibold shadow-sm border border-current/10`
                                            : `${getColorClasses(item.color as string).hover}`,
                                        "hover:scale-[1.02] hover:shadow-sm transition-all duration-300 ease-in-out",
                                    )}
                                    onClick={() => handleMenuClick(item.title)}
                                >
                                    <Link href={item.url} className="pl-5">
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </div>
                    )
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}
