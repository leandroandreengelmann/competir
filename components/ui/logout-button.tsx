"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/app/actions/auth"
import { cn } from "@/lib/utils"

interface LogoutButtonProps {
    variant?: "outline" | "ghost" | "destructive" | "default" | "secondary"
    size?: "default" | "sm" | "lg" | "icon"
    className?: string
    showText?: boolean
}

export function LogoutButton({
    variant = "outline",
    size = "sm",
    className,
    showText = true
}: LogoutButtonProps) {
    return (
        <Button
            onClick={() => logoutAction()}
            variant={variant}
            size={size}
            className={cn("gap-2", className)}
        >
            <LogOut className="h-4 w-4" />
            {showText && "Sair"}
        </Button>
    )
}
