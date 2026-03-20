import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "~/lib/utils"

const countBadgeVariants = cva(
	"inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-medium text-xs",
	{
		variants: {
			variant: {
				default: "bg-tertiary text-tertiary-foreground",
				outline: "border border-border bg-background text-muted-foreground"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	}
)

interface CountBadgeProps extends VariantProps<typeof countBadgeVariants> {
	count: number
	className?: string
}

export function CountBadge({
	count,
	variant,
	className,
	...props
}: CountBadgeProps & ComponentProps<"span">) {
	return (
		<span
			className={cn(
				countBadgeVariants({ variant }),
				count === 0 && "opacity-50",
				className
			)}
			{...props}
		>
			{count}
		</span>
	)
}
