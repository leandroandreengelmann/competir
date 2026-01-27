'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutAction } from "@/app/actions/auth"
import { User, KeyRound, LogOut } from "lucide-react"
import Link from "next/link"

interface AppHeaderProps {
    userName: string
    role?: string
}

export function AppHeader({ userName, role }: AppHeaderProps) {
    const basePath = role === 'super_admin' ? '/painel/super-admin' :
        role === 'organizador' ? '/painel/organizador' :
            '/painel/atleta'

    // Função para gerar iniciais do nome
    // Exemplo: "Leandro Andre" → "LA"
    const getInitials = (name: string) => {
        const parts = name.trim().split(' ')
        if (parts.length === 1) {
            // Nome único: primeiras 2 letras
            return parts[0].substring(0, 2).toUpperCase()
        }
        // Múltiplas palavras: primeira letra do primeiro + primeira letra do último
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }

    const initials = getInitials(userName)

    return (
        <header className="hidden md:flex sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
                {/* Logo "Competir" */}
                <div className="flex items-center">
                    <Link href={basePath}>
                        <h1 className="text-2xl font-bold text-primary tracking-tight cursor-pointer">
                            Competir
                        </h1>
                    </Link>
                </div>

                {/* Avatar + Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="flex items-center gap-3 rounded-full overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            aria-label="Menu do usuário"
                        >
                            {/* Avatar circular com iniciais */}
                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm cursor-pointer hover:shadow-md transition-shadow">
                                {initials}
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-64">
                        {/* Nome do usuário - Label com destaque */}
                        <DropdownMenuLabel className="font-semibold text-base">
                            {userName}
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        {/* Meu perfil */}
                        <DropdownMenuItem asChild>
                            <Link href={`${basePath}/meu-perfil`} className="flex items-center w-full cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>Meu perfil</span>
                            </Link>
                        </DropdownMenuItem>

                        {/* Alterar senha */}
                        <DropdownMenuItem asChild>
                            <Link href={`${basePath}/alterar-senha`} className="flex items-center w-full cursor-pointer">
                                <KeyRound className="mr-2 h-4 w-4" />
                                <span>Alterar senha</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Sair - chama logoutAction diretamente */}
                        <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => logoutAction()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
