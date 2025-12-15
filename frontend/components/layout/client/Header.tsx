"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { LanguageBadge } from '@/components/ui/language-badge';
import { AnimatedCloudIcon } from '@/components/custom/icon/animated-cloud-icon';

const ClientHeader = () => {
    return (
        <header className="flex items-center justify-between border-b px-4 md:px-6 py-4 bg-white dark:bg-slate-950 shrink-0">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <ThemeSwitcher />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <LanguageBadge />
                <AnimatedCloudIcon size={36} />
            </div>
        </header>
    )
}

export default ClientHeader
