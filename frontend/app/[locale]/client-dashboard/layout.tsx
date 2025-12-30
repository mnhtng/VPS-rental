import { generatePageMetadata } from '@/utils/page-metadata';
import { Metadata } from 'next';
import { auth } from "@/lib/auth";
import ClientHeader from "@/components/layout/client/Header";
import ClientSidebar from "@/components/layout/client/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type React from "react"
import { headers } from "next/headers";

import "@/styles/globals.css";
import "@/styles/styles.css";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePageMetadata({
    locale,
    page: 'client-dashboard',
    path: '/client-dashboard'
  });
}

export default async function ClientDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  if (!session || !session.user) {
    throw new Error('401', {
      cause: {
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this page.',
      },
    });
  }

  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  const isErrorPage = pathname.includes('error') || pathname.includes('not-found')

  return (
    <>
      {!isErrorPage ? (
        <SidebarProvider>
          <div className="flex w-full h-screen overflow-hidden">
            <ClientSidebar />

            <SidebarInset className="h-screen overflow-hidden">
              <div className="h-full overflow-y-auto flex flex-col gap-5">
                <ClientHeader />

                <div className="flex-1 px-4 md:px-6 bg-slate-50/50 dark:bg-slate-950/50">
                  {children}
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      ) : (
        { children }
      )}
    </>
  )
}
