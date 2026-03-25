import { cva } from "class-variance-authority"
import { cn } from "~/lib/utils"

const reviewStatusDotVariants = cva("inline-block rounded-full shrink-0", {
	variants: {
		size: {
			default: "h-2 w-2",
			compact: "h-1.5 w-1.5"
		},
		tone: {
			danger: "",
			info: "",
			neutral: ""
		}
	},
	compoundVariants: [
		{
			tone: "danger",
			className: "bg-rose-500 dark:bg-rose-400"
		},
		{
			tone: "info",
			className: "bg-blue-500 dark:bg-blue-400"
		},
		{
			tone: "neutral",
			className: "bg-zinc-400 dark:bg-zinc-500"
		}
	],
	defaultVariants: {
		size: "compact"
	}
})

type ReviewStatusDotsProps = {
	overdueCount: number
	dueTodayCount: number
	unscheduledCount: number
	size?: "default" | "compact"
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
						tone: "danger"
					})}
					data-testid={testIdPrefix ? `${testIdPrefix}-overdue-dot` : undefined}
				/>
			) : null}
			{dueTodayCount > 0 ? (
				<span
					aria-hidden={true}
					className={reviewStatusDotVariants({
						size,
						tone: "info"
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
						tone: "neutral"
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
