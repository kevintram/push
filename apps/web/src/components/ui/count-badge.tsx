import { cn } from "~/lib/utils"

interface CountBadgeProps {
	count: number
	className?: string
}

export function CountBadge({ count, className }: CountBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-tertiary px-1.5 font-medium text-tertiary-foreground text-xs",
				count === 0 && "opacity-50",
				className
			)}
		>
			{count}
		</span>
	)
}
