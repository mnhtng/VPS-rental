import { Header } from "@/components/layout/Header"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import type React from "react"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/50">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
