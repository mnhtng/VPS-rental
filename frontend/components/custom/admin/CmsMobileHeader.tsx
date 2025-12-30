"use client"

import React from 'react'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { useCms } from '@/contexts/cmsContext'

const CmsMobileHeader = () => {
    const { isMobile } = useSidebar()
    const { page, description } = useCms()

    return (
        <>
            {isMobile ? (
                <header className="sticky top-0 z-50 bg-background flex justify-between pr-3 h-16 shrink-0 items-center gap-2 border-b">
                    <div className="flex items-center gap-2 px-3">
                        <SidebarTrigger />
                    </div>

                    <div className="flex items-center gap-2">
                        <h1 className="text-muted-foreground">{page}</h1>
                    </div>
                </header>
            ) : (
                <div className="flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold">{page}</h1>
                            <p>{description}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default CmsMobileHeader
