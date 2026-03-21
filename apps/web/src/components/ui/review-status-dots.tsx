import { cva } from "class-variance-authority"
import { cn } from "~/lib/utils"

const reviewStatusDotVariants = cva("inline-block rounded-full shrink-0", {
	variants: {
		size: {
			default: "h-2 w-2",
			compact: "h-1.5 w-1.5"
		},
		surface: {
			default: "",
			primary: ""
		},
		tone: {
			overdue: "",
			dueToday: "",
			unscheduled: ""
		}
	},
	compoundVariants: [
		{
			surface: "default",
			tone: "overdue",
			className: "bg-red-500 dark:bg-red-400"
		},
		{
			surface: "primary",
			tone: "overdue",
			className: "bg-red-300 dark:bg-red-400"
		},
		{
			surface: "default",
			tone: "dueToday",
			className: "bg-blue-500 dark:bg-blue-400"
		},
		{
			surface: "primary",
			tone: "dueToday",
			className: "bg-blue-300 dark:bg-blue-400"
		},
		{
			surface: "default",
			tone: "unscheduled",
			className: "bg-zinc-400 dark:bg-zinc-500"
		},
		{
			surface: "primary",
			tone: "unscheduled",
			className: "bg-zinc-300 dark:bg-zinc-400"
		}
	],
	defaultVariants: {
		size: "compact",
		surface: "default"
	}
})

type ReviewStatusDotsProps = {
	overdueCount: number
	dueTodayCount: number
	unscheduledCount: number
	size?: "default" | "compact"
	surface?: "default" | "primary"
	className?: string
	testIdPrefix?: string
}

function buildSummary({
	overdueCount,
	dueTodayCount,
	unscheduledCount
}: Pick<
	ReviewStatusDotsProps,
	"overdueCount" | "dueTodayCount" | "unscheduledCount"
>) {
	const parts: Array<string> = []

	if (overdueCount > 0) parts.push("Has overdue reviews")
	if (dueTodayCount > 0) parts.push("Has reviews due today")
	if (unscheduledCount > 0) parts.push("Has unscheduled reviews")

	return parts.join(". ")
}

export function ReviewStatusDots({
	overdueCount,
	dueTodayCount,
	unscheduledCount,
	size = "compact",
	surface = "default",
	className,
	testIdPrefix
}: ReviewStatusDotsProps) {
	const summary = buildSummary({
		overdueCount,
		dueTodayCount,
		unscheduledCount
	})

	if (!summary) return null

	return (
		<span className={cn("inline-flex items-center gap-0.5", className)}>
			{overdueCount > 0 ? (
				<span
					aria-hidden={true}
					className={reviewStatusDotVariants({
						size,
						surface,
						tone: "overdue"
					})}
					data-testid={testIdPrefix ? `${testIdPrefix}-overdue-dot` : undefined}
				/>
			) : null}
			{dueTodayCount > 0 ? (
				<span
					aria-hidden={true}
					className={reviewStatusDotVariants({
						size,
						surface,
						tone: "dueToday"
					})}
					data-testid={
						testIdPrefix ? `${testIdPrefix}-due-today-dot` : undefined
					}
				/>
			) : null}
			{unscheduledCount > 0 ? (
				<span
					aria-hidden={true}
					className={reviewStatusDotVariants({
						size,
						surface,
						tone: "unscheduled"
					})}
					data-testid={
						testIdPrefix ? `${testIdPrefix}-unscheduled-dot` : undefined
					}
				/>
			) : null}
			<span className='sr-only'>{summary}</span>
		</span>
	)
}
