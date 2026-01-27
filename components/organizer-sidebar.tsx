"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { CalendarPlus, LayoutDashboard, Calendar, Plus, Tags, Wallet } from "lucide-react"

interface OrganizerSidebarProps {
    className?: string
}

export function OrganizerSidebar({ className }: OrganizerSidebarProps) {
    const pathname = usePathname()

    const links = [
        {
            href: "/painel/organizador",
            label: "Dashboard",
            icon: LayoutDashboard,
            active: pathname === "/painel/organizador"
        },
        {
            href: "/painel/organizador/eventos",
            label: "Meus Eventos",
            icon: Calendar,
            active: pathname === "/painel/organizador/eventos" || (pathname.startsWith("/painel/organizador/eventos/") && pathname !== "/painel/organizador/eventos/novo")
        },
        {
            href: "/painel/organizador/eventos/novo",
            label: "Novo Evento",
            icon: Plus,
            active: pathname === "/painel/organizador/eventos/novo"
        },
        {
            href: "/painel/organizador/categorias",
            label: "Categorias",
            icon: Tags,
            active: pathname === "/painel/organizador/categorias"
        },
        {
            href: "/painel/organizador/pagamentos",
            label: "Pagamentos",
            icon: Wallet,
            active: pathname === "/painel/organizador/pagamentos"
        }
    ]

    return (
        <aside className={cn("w-64 border-r bg-card min-h-screen p-6 flex flex-col gap-6", className)}>
            <div className="font-bold text-2xl tracking-tight text-primary">
                Organizador
            </div>
            <nav className="flex flex-col gap-2">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            link.active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                    </Link>
                ))}
            </nav>
        </aside>
    )
}
