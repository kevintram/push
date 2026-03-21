import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "~/lib/utils"

const countBadgeVariants = cva(
	"inline-flex items-center justify-center rounded-full font-medium leading-none",
	{
		variants: {
			context: {
				default: "",
				primary: ""
			},
			size: {
				default: "h-5 min-w-5 px-1.5 text-xs",
				compact: "h-4 min-w-4 px-1 text-[10px]"
			},
			tone: {
				neutral: "",
				unscheduled: "",
				overdue: "",
				dueToday: ""
			},
			variant: {
				default: "",
				outline: ""
			}
		},
		compoundVariants: [
			{
				tone: "neutral",
				variant: "default",
				className: "bg-tertiary text-tertiary-foreground"
			},
			{
				tone: "neutral",
				variant: "outline",
				className: "border border-border bg-background text-muted-foreground"
			},
			{
				context: "default",
				tone: "unscheduled",
				className:
					"border border-foreground/8 bg-foreground/8 text-foreground dark:border-background/12 dark:bg-background/12 dark:text-foreground"
			},
			{
				context: "primary",
				tone: "unscheduled",
				className:
					"border border-primary-foreground/12 bg-primary-foreground/12 text-primary-foreground dark:border-zinc-300 dark:bg-zinc-200 dark:text-zinc-900"
			},
			{
				context: "default",
				tone: "overdue",
				className:
					"border border-red-500/16 bg-red-500/14 text-red-700 dark:border-red-400/14 dark:bg-red-400/14 dark:text-red-300"
			},
			{
				context: "primary",
				tone: "overdue",
				className:
					"border border-red-300/38 bg-red-400/34 text-white dark:border-red-500/12 dark:bg-red-500/10 dark:text-red-700"
			},
			{
				context: "default",
				tone: "dueToday",
				className:
					"border border-blue-500/16 bg-blue-500/14 text-blue-700 dark:border-blue-400/14 dark:bg-blue-400/14 dark:text-blue-300"
			},
			{
				context: "primary",
				tone: "dueToday",
				className:
					"border border-blue-300/38 bg-blue-400/34 text-white dark:border-blue-500/12 dark:bg-blue-500/10 dark:text-blue-700"
			}
		],
		defaultVariants: {
			context: "default",
			size: "default",
			tone: "neutral",
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
	context,
	size,
	tone,
	variant,
	className,
	...props
}: CountBadgeProps & ComponentProps<"span">) {
	return (
		<span
			className={cn(
				countBadgeVariants({ context, size, tone, variant }),
				count === 0 && "opacity-50",
				className
			)}
			{...props}
		>
			{count}
		</span>
	)
}
