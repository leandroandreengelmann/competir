"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Building2, Settings, Tags, ShieldCheck } from "lucide-react"

interface AdminSidebarProps {
    className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
    const pathname = usePathname()

    const links = [
        {
            href: "/painel/super-admin",
            label: "Dashboard",
            icon: LayoutDashboard,
            active: pathname === "/painel/super-admin"
        },

        {
            href: "/painel/super-admin/organizadores",
            label: "Organizadores",
            icon: Building2,
            active: pathname.startsWith("/painel/super-admin/organizadores")
        },
        {
            href: "/painel/super-admin/faixas",
            label: "Faixas",
            icon: Tags,
            active: pathname.startsWith("/painel/super-admin/faixas")
        },
        {
            href: "/painel/super-admin/faixas-etarias",
            label: "Faixas Etárias",
            icon: Users,
            active: pathname.startsWith("/painel/super-admin/faixas-etarias")
        },
        {
            href: "/painel/super-admin/knowledge-base",
            label: "Base de Conhecimento",
            icon: LayoutDashboard, // Mantendo ícone neutro
            active: pathname.startsWith("/painel/super-admin/knowledge-base")
        },
        {
            href: "/painel/super-admin/configuracoes/openai",
            label: "OpenAI",
            icon: Settings,
            active: pathname.startsWith("/painel/super-admin/configuracoes/openai")
        },
        {
            href: "/painel/super-admin/configuracoes/login",
            label: "Background Login",
            icon: Settings,
            active: pathname.startsWith("/painel/super-admin/configuracoes/login")
        },
        {
            href: "/painel/super-admin/regras-categorias",
            label: "Regras de Categorias",
            icon: ShieldCheck,
            active: pathname.startsWith("/painel/super-admin/regras-categorias")
        }
    ]

    return (
        <aside className={cn("w-64 border-r bg-card min-h-screen p-6 flex flex-col gap-6", className)}>
            <div className="font-bold text-2xl tracking-tight text-primary">
                Painel Admin
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
