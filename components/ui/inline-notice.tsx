import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { LucideIcon, Info, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react"

const inlineNoticeVariants = cva(
    "flex gap-3 p-4 rounded-xl border text-sm items-start transition-all animate-in fade-in slide-in-from-top-1 duration-200",
    {
        variants: {
            variant: {
                neutral: "bg-muted border-border text-muted-foreground",
                info: "bg-primary/5 border-primary/10 text-primary-foreground/80", // Adaptado para usar primary de forma sutil
                success: "bg-success/10 border-success/20 text-success-foreground",
                warning: "bg-warning/10 border-warning/20 text-warning-foreground",
                destructive: "bg-destructive/10 border-destructive/20 text-destructive",
                error: "bg-destructive/10 border-destructive/20 text-destructive",
            },
            compact: {
                true: "p-3 rounded-lg gap-2.5",
                false: "",
            }
        },
        defaultVariants: {
            variant: "neutral",
            compact: false,
        },
    }
)

const defaultIcons: Record<string, LucideIcon> = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    destructive: AlertCircle,
}

export interface InlineNoticeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inlineNoticeVariants> {
    message: React.ReactNode
    icon?: LucideIcon | null
    showIcon?: boolean
}

function InlineNotice({
    className,
    variant,
    compact,
    message,
    icon,
    showIcon = true,
    ...props
}: InlineNoticeProps) {
    const IconComponent = icon || (variant && defaultIcons[variant as keyof typeof defaultIcons]) || Info

    return (
        <div
            role={(variant === "error" || variant === "destructive") ? "alert" : undefined}
            className={cn(inlineNoticeVariants({ variant, compact, className }))}
            {...props}
        >
            {showIcon && IconComponent && (
                <IconComponent className={cn(
                    "shrink-0",
                    compact ? "h-4 w-4" : "h-5 w-5",
                    "mt-0.5"
                )} />
            )}
            <div className="flex-1 leading-relaxed">
                {message}
            </div>
        </div>
    )
}

export { InlineNotice, inlineNoticeVariants }
