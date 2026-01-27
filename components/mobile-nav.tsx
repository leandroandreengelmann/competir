"use client"

import * as React from "react"
import { Menu, Home, User, KeyRound, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { OrganizerSidebar } from "@/components/organizer-sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { logoutAction } from "@/app/actions/auth"
import Link from "next/link"

interface MobileNavProps {
    title?: string
    role?: "organizador" | "atleta" | "super_admin"
}

// Componente de menu do atleta
function AthleteMenu({ onItemClick }: { onItemClick: () => void }) {
    return (
        <div className="flex flex-col h-full p-6">
            {/* Título do drawer */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-primary tracking-tight">
                    Competir
                </h2>
            </div>

            {/* Navegação */}
            <nav className="flex-1 space-y-1">
                {/* Eventos disponíveis */}
                <Link
                    href="/painel/atleta"
                    onClick={onItemClick}
                    className="flex items-center gap-3 px-4 py-3 text-base rounded-lg hover:bg-accent transition-colors"
                >
                    <Home className="h-5 w-5" />
                    <span>Eventos disponíveis</span>
                </Link>

                {/* Meu perfil */}
                <Link
                    href="/painel/atleta/meu-perfil"
                    onClick={onItemClick}
                    className="flex items-center gap-3 px-4 py-3 text-base rounded-lg hover:bg-accent transition-colors"
                >
                    <User className="h-5 w-5" />
                    <span>Meu perfil</span>
                </Link>

                {/* Alterar senha */}
                <Link
                    href="/painel/atleta/alterar-senha"
                    onClick={onItemClick}
                    className="flex items-center gap-3 px-4 py-3 text-base rounded-lg hover:bg-accent transition-colors"
                >
                    <KeyRound className="h-5 w-5" />
                    <span>Alterar senha</span>
                </Link>

                {/* Separador visual */}
                <div className="pt-2 pb-2">
                    <div className="border-t border-border"></div>
                </div>

                {/* Sair */}
                <button
                    onClick={() => {
                        onItemClick()
                        logoutAction()
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-base rounded-lg hover:bg-accent transition-colors text-destructive w-full text-left"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Sair</span>
                </button>
            </nav>
        </div>
    )
}

export function MobileNav({ title = "Competir", role = "organizador" }: MobileNavProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-surface border-b flex items-center justify-between px-4 lg:hidden">
            <div className="flex items-center gap-3">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Menu de Navegação</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-none w-[280px]">
                        <SheetHeader className="hidden">
                            <SheetTitle>Menu</SheetTitle>
                        </SheetHeader>
                        <div className="h-full" onClick={() => setOpen(false)}>
                            {role === "organizador" ? (
                                <OrganizerSidebar className="w-full min-h-full border-none" />
                            ) : role === "super_admin" ? (
                                <AdminSidebar className="w-full min-h-full border-none" />
                            ) : (
                                <AthleteMenu onItemClick={() => setOpen(false)} />
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
                <div className="font-bold text-lg tracking-tight text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                    {title}
                </div>
            </div>
        </header>
    )
}
