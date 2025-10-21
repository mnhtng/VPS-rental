"use client"

import { usePathname } from "next/navigation"
import { createContext, use, useEffect, useState } from "react"

interface CmsContextProps {
    page: "dashboard" | "users" | "articles" | "chats" | "analytics"
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
        description: "Get a quick overview of your website’s activity, updates, and key stats in one place."
    },
    users: {
        url: "/admin/users",
        title: "Users",
        description: "Manage user accounts, roles, and permissions for your system."
    },
    articles: {
        url: "/admin/articles",
        title: "Articles",
        description: "Create, edit, and organize articles to keep your content up-to-date."
    },
    chats: {
        url: "/admin/chats",
        title: "Chats",
        description: "Review and manage conversations between users and the AI assistant."
    },
    analytics: {
        url: "/admin/analytics",
        title: "Analytics",
        description: "View reports and metrics to track your website’s performance and engagement."
    }
}

export function CmsProvider({
    children,
    ...props
}: React.ComponentProps<"div">) {
    const pathname = usePathname()

    const [redirectPage, setRedirectPage] = useState<{ page: "dashboard" | "users" | "articles" | "chats" | "analytics", description: string }>({
        page: PageInfo.dashboard.title as "dashboard" | "users" | "articles" | "chats" | "analytics",
        description: PageInfo.dashboard.description
    })

    useEffect(() => {
        const currentPage = Object.values(PageInfo).find(page => pathname === page.url)

        if (currentPage) {
            setRedirectPage({
                page: currentPage.title as "dashboard" | "users" | "articles" | "chats" | "analytics",
                description: currentPage.description
            })
        } else {
            setRedirectPage({
                page: PageInfo.dashboard.title as "dashboard" | "users" | "articles" | "chats" | "analytics",
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