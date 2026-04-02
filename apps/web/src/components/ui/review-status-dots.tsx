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
		},
		surfaceContext: {
			default: "",
			primary: ""
		}
	},
	compoundVariants: [
		{
			tone: "danger",
			surfaceContext: "default",
			className: "bg-rose-500 dark:bg-rose-400"
		},
		{
			tone: "info",
			surfaceContext: "default",
			className: "bg-blue-500 dark:bg-blue-400"
		},
		{
			tone: "neutral",
			surfaceContext: "default",
			className: "bg-white"
		},
		{
			tone: "danger",
			surfaceContext: "primary",
			className: "bg-rose-400 dark:bg-rose-500"
		},
		{
			tone: "info",
			surfaceContext: "primary",
			className: "bg-blue-400 dark:bg-blue-500"
		},
		{
			tone: "neutral",
			surfaceContext: "primary",
			className: "bg-white dark:bg-zinc-950"
		}
	],
	defaultVariants: {
		size: "compact",
		surfaceContext: "default"
	}
})

type ReviewStatusDotsProps = {
	overdueCount: number
	dueTodayCount: number
	unscheduledCount: number
	size?: "default" | "compact"
	surfaceContext?: "default" | "primary"
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
	surfaceContext = "default",
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
						tone: "danger",
						surfaceContext
					})}
					data-testid={testIdPrefix ? `${testIdPrefix}-overdue-dot` : undefined}
				/>
			) : null}
			{dueTodayCount > 0 ? (
				<span
					aria-hidden={true}
					className={reviewStatusDotVariants({
						size,
						tone: "info",
						surfaceContext
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
						tone: "neutral",
						surfaceContext
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
