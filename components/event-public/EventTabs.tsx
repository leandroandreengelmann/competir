"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Info, BarChart3, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = {
    id: string
    label: string
    icon: React.ElementType
}

const tabs: Tab[] = [
    { id: "info", label: "Informações gerais", icon: Info },
]

interface EventTabsProps {
    activeTab: string
    onTabChange: (id: string) => void
}

export function EventTabs({ activeTab, onTabChange }: EventTabsProps) {
    return (
        <div className="relative flex flex-wrap gap-2 p-1.5 bg-muted/40 backdrop-blur-sm rounded-2xl border w-fit">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                const Icon = tab.icon

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300",
                            isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-primary/60")} />
                            {tab.label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
