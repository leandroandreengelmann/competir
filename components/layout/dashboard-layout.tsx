"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Bell,
    Home,
    LayoutDashboard,
    Menu,
    Settings,
    Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: Home },
        { href: "/users", label: "Usuários", icon: Users },
        { href: "/projects", label: "Projetos", icon: LayoutDashboard },
        { href: "/settings", label: "Configurações", icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar Desktop */}
            <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-border bg-surface-secondary lg:block">
                <div className="flex h-16 items-center border-b border-border px-6">
                    <span className="text-lg font-bold text-primary">Brand</span>
                </div>
                <nav className="space-y-1 p-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 hover:text-foreground",
                                pathname === item.href
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Header Mobile / Desktop */}
                <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>

                    <div className="ml-auto flex items-center gap-4">
                        <Button variant="ghost" size="icon">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <div className="h-8 w-8 rounded-full bg-primary/20" />
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">{children}</main>
            </div>
        </div>
    )
}
