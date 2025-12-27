"use client"

import { usePathname } from "next/navigation"
import { createContext, use, useEffect, useState } from "react"

interface CmsContextProps {
    page: "dashboard" | "users" | "vps" | "plans" | "support" | "revenue" | "analytics"
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

const PageInfo = {
    dashboard: {
        url: "/admin",
        title: "Dashboard",
        description: "Get a quick overview of your website's activity, updates, and key stats in one place."
    },
    users: {
        url: "/admin/users",
        title: "Users",
        description: "Manage user accounts, roles, and permissions for your system."
    },
    vps: {
        url: "/admin/vps",
        title: "VPS",
        description: "Manage your virtual private servers, including creation, configuration, and monitoring."
    },
    plans: {
        url: "/admin/plans",
        title: "Plans",
        description: "Manage subscription plans, pricing, and features available to users."
    },
    support: {
        url: "/admin/support",
        title: "Support",
        description: "Manage support tickets, respond to customer inquiries, and track issue resolution."
    },
    revenue: {
        url: "/admin/revenue",
        title: "Revenue",
        description: "Manage and track your revenue streams, including payments, invoices, and financial reports."
    },
    analytics: {
        url: "/admin/analytics",
        title: "Analytics",
        description: "View reports and metrics to track your website's performance and engagement."
    }
}

type PageType = "dashboard" | "users" | "vps" | "plans" | "support" | "revenue" | "analytics"

export function CmsProvider({
    children,
    ...props
}: React.ComponentProps<"div">) {
    const pathname = usePathname()

    const [redirectPage, setRedirectPage] = useState<{ page: PageType, description: string }>({
        page: PageInfo.dashboard.title as PageType,
        description: PageInfo.dashboard.description
    })

    useEffect(() => {
        const currentPage = Object.entries(PageInfo).find(([, page]) => pathname?.endsWith(page.url))

        if (currentPage) {
            setRedirectPage({
                page: currentPage[1].title as PageType,
                description: currentPage[1].description
            })
        } else {
            setRedirectPage({
                page: PageInfo.dashboard.title as PageType,
                description: PageInfo.dashboard.description
            })
        }
    }, [pathname])

    return (
        <CmsContext.Provider
            value={{
                page: redirectPage.page,
                description: redirectPage.description || "",
            }}
            {...props}
        >
            {children}
        </CmsContext.Provider>
    )
}
