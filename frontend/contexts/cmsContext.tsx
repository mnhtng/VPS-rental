"use client"

import { usePathname } from "next/navigation"
import { createContext, use, useEffect, useState } from "react"
import { useTranslations } from "next-intl"

interface CmsContextProps {
    page: "DASHBOARD" | "USERS" | "VPS" | "PLANS" | "SUPPORT" | "REVENUE" | "ANALYTICS"
    description?: string
}

const CmsContext = createContext<CmsContextProps | undefined>(undefined)

export function useCms() {
    const context = use(CmsContext)
    if (!context) {
        throw new Error('useCms must be used within a CmsProvider')
    }
    return context
}

type PageType = "DASHBOARD" | "USERS" | "VPS" | "PLANS" | "SUPPORT" | "REVENUE" | "ANALYTICS"

const PageUrls: Record<PageType, string> = {
    DASHBOARD: "/admin",
    USERS: "/admin/users",
    VPS: "/admin/vps",
    PLANS: "/admin/plans",
    SUPPORT: "/admin/support",
    REVENUE: "/admin/revenue",
    ANALYTICS: "/admin/analytics"
}

export function CmsProvider({
    children,
    ...props
}: React.ComponentProps<"div">) {
    const pathname = usePathname()
    const t = useTranslations('admin.pages')

    const [currentPage, setCurrentPage] = useState<PageType>("DASHBOARD")

    useEffect(() => {
        const foundPage = Object.entries(PageUrls).find(([, url]) => pathname?.endsWith(url))

        if (foundPage) {
            setCurrentPage(foundPage[0] as PageType)
        } else {
            setCurrentPage("DASHBOARD")
        }
    }, [pathname])

    const description = t(`${currentPage.toLowerCase()}.description`)

    return (
        <CmsContext.Provider
            value={{
                page: currentPage,
                description: description,
            }}
            {...props}
        >
            {children}
        </CmsContext.Provider>
    )
}
