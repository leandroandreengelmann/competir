"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface User {
    id: string
    name: string
    email: string
    role: string
}

interface PublicHeaderProps {
    user?: User | null
}

export function PublicHeader({ user }: PublicHeaderProps) {
    return (
        <div className="border-b bg-surface">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/" className="hover:opacity-80 transition-opacity">
                            <h1 className="text-4xl font-bold tracking-tight text-[#53389e]">Competir</h1>
                        </Link>
                        <p className="text-muted-foreground mt-2 text-lg hidden sm:block">
                            Encontre campeonatos e demonstre seu interesse
                        </p>
                    </div>
                    {!user && (
                        <Button asChild>
                            <Link href="/login">Acesse já</Link>
                        </Button>
                    )}
                    {user && (
                        <Button variant="outline" asChild>
                            <Link href={`/painel/${user.role === 'atleta' ? 'atleta' : user.role === 'organizador' ? 'organizador' : 'super-admin'}`}>
                                Meu Painel
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
