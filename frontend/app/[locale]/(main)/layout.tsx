import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Header />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </>
    )
}