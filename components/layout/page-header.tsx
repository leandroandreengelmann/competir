import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    description?: string
    children?: React.ReactNode
}

export function PageHeader({
    title,
    description,
    children,
    className,
    ...props
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6",
                className
            )}
            {...props}
        >
            <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
    )
}
