"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function PublicFooter() {
    return (
        <footer className="w-full bg-brand-950 text-white mt-auto py-10 md:py-12 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center">
                        <span className="font-bold tracking-widest text-xl">COMPETIR</span>
                    </div>

                    <p className="text-sm text-white/90 font-medium text-center sm:text-right">
                        © 2026 Competir — Sistema de Gerenciamento de Eventos
                    </p>
                </div>
            </div>
        </footer>
    )
}
