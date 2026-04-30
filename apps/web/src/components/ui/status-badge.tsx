import type { KeyboardEvent, ReactNode } from "react"

import { Badge } from "~/components/ui/badge"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "~/components/ui/tooltip"
import { cn } from "~/lib/utils"

export type StatusBadgeTone = "danger" | "info" | "neutral" | "warning"

export type StatusBadgeItem = {
	label: string
	tone: StatusBadgeTone
	icon?: ReactNode
	tooltip?: string | null
	onClick?: () => void
	className?: string
}

const STATUS_BADGE_TONE_CLASSNAMES: Record<StatusBadgeTone, string> = {
	danger:
		"h-5 border-transparent bg-rose-200 text-rose-900 text-xs dark:bg-rose-950 dark:text-rose-200",
	info: "h-5 border border-blue-300 bg-blue-100 text-blue-900 text-xs dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200",
	neutral:
		"h-5 border border-zinc-300 bg-zinc-100 text-zinc-900 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
	warning:
		"h-5 border-transparent bg-amber-100 text-amber-900 text-xs dark:bg-amber-950 dark:text-amber-200"
}

type StatusBadgeProps = StatusBadgeItem & {
	className?: string
}

function StatusBadgeContent({
	className,
	icon,
	label,
	onClick,
	tone
}: StatusBadgeProps) {
	function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
		if (!onClick || (event.key !== "Enter" && event.key !== " ")) return
		event.preventDefault()
		event.stopPropagation()
		onClick()
	}

	return (
		<Badge
			className={cn(
				STATUS_BADGE_TONE_CLASSNAMES[tone],
				"rounded-sm shadow-sm",
				className
			)}
			onClick={event => {
				if (!onClick) return
				event.stopPropagation()
				onClick()
			}}
			onKeyDown={handleKeyDown}
			role={onClick ? "button" : undefined}
			tabIndex={onClick ? 0 : undefined}
			variant={tone === "danger" ? "destructive" : "outline"}
		>
			{icon ? <span className='inline-flex items-center'>{icon}</span> : null}
			{label ? <span>{label}</span> : null}
		</Badge>
	)
}

export function StatusBadge({ tooltip, ...props }: StatusBadgeProps) {
	if (!tooltip) return <StatusBadgeContent {...props} />

	return (
		<Tooltip>
			<TooltipTrigger render={<StatusBadgeContent {...props} />} />
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	)
}

type StatusBadgeListProps = {
	badges: Array<StatusBadgeItem>
	className?: string
	badgeClassName?: string
}

export function StatusBadgeList({
	badges,
	className,
	badgeClassName
}: StatusBadgeListProps) {
	if (badges.length === 0) return null

	return (
		<div className={cn("flex flex-wrap items-center gap-1.5", className)}>
			{badges.map((badge, index) => (
				<StatusBadge
					{...badge}
					className={cn(badge.className, badgeClassName)}
					key={`${badge.label}-${index}`}
				/>
			))}
		</div>
	)
}
