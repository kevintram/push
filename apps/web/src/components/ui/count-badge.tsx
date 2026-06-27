import { cva, type VariantProps } from "class-variance-authority"
import { type ComponentProps } from "react"

import { cn } from "~/lib/utils"

const countBadgeVariants = cva(
	"inline-flex items-center justify-center rounded-full font-medium leading-none",
	{
		variants: {
			size: {
				default: "h-5 min-w-5 px-1.5 text-xs",
				compact: "h-4 min-w-4 px-1 text-[10px]",
			},
			tone: {
				default: "",
				neutral: "",
				danger: "",
				info: "",
			},
			variant: {
				default: "",
				outline: "",
			},
		},
		compoundVariants: [
			{
				tone: "default",
				variant: "default",
				className: "bg-tertiary text-tertiary-foreground",
			},
			{
				tone: "default",
				variant: "outline",
				className:
					"border border-border bg-background text-muted-foreground",
			},
			{
				tone: "neutral",
				className:
					"border border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
			},
			{
				tone: "danger",
				className:
					"border-transparent bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
			},
			{
				tone: "info",
				className:
					"border border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200",
			},
		],
		defaultVariants: {
			size: "default",
			tone: "default",
			variant: "default",
		},
	},
)

interface CountBadgeProps extends VariantProps<typeof countBadgeVariants> {
	count: number
	className?: string
}

export function CountBadge({
	count,
	size,
	tone,
	variant,
	className,
	...props
}: CountBadgeProps & ComponentProps<"span">) {
	return (
		<span
			className={cn(
				countBadgeVariants({ size, tone, variant }),
				count === 0 && "opacity-50",
				className,
			)}
			{...props}
		>
			{count}
		</span>
	)
}
