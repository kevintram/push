import { cva } from "class-variance-authority"
import { cn } from "~/lib/utils"

export const reviewStatusDotVariants = cva(
	"inline-block rounded-full shrink-0",
	{
		variants: {
			size: {
				default: "h-2 w-2",
				compact: "h-1.5 w-1.5"
			},
			tone: {
				danger: "",
				info: "",
				neutral: "",
				"neutral-solid": ""
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
				className:
					"border border-zinc-950 bg-transparent dark:border-0 dark:bg-white"
			},
			{
				tone: "neutral-solid",
				surfaceContext: "default",
				className: "bg-zinc-900 dark:bg-white"
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
				className:
					"bg-white dark:border dark:border-zinc-950 dark:bg-transparent"
			},
			{
				tone: "neutral-solid",
				surfaceContext: "primary",
				className: "bg-zinc-900 dark:bg-white"
			}
		],
		defaultVariants: {
			size: "compact",
			surfaceContext: "default"
		}
	}
)

type ReviewStatusDotsProps = {
	overdueCount: number
	dueTodayCount: number
	pendingCount: number
	size?: "default" | "compact"
	surfaceContext?: "default" | "primary"
	neutralVariant?: "outline" | "solid"
	layout?: "row" | "stacked"
	className?: string
	testIdPrefix?: string
}

function buildSummary({
	overdueCount,
	dueTodayCount,
	pendingCount
}: Pick<
	ReviewStatusDotsProps,
	"overdueCount" | "dueTodayCount" | "pendingCount"
>) {
	const parts: Array<string> = []

	if (overdueCount > 0) parts.push("Has overdue reviews")
	if (dueTodayCount > 0) parts.push("Has reviews due today")
	if (pendingCount > 0) parts.push("Has pending reviews")

	return parts.join(". ")
}

export function ReviewStatusDots({
	overdueCount,
	dueTodayCount,
	pendingCount,
	size = "compact",
	surfaceContext = "default",
	neutralVariant = "outline",
	layout = "row",
	className,
	testIdPrefix
}: ReviewStatusDotsProps) {
	const summary = buildSummary({
		overdueCount,
		dueTodayCount,
		pendingCount
	})

	if (!summary) return null

	const isStacked = layout === "stacked"

	return (
		<span
			className={cn(
				"inline-flex items-center",
				isStacked ? "[&>*:not(:first-child)]:-ml-0.5" : "gap-0.5",
				className
			)}
		>
			{overdueCount > 0 ? (
				<span
					aria-hidden={true}
					className={cn(
						reviewStatusDotVariants({ size, tone: "danger", surfaceContext }),
						isStacked && "relative z-[3]"
					)}
					data-testid={testIdPrefix ? `${testIdPrefix}-overdue-dot` : undefined}
				/>
			) : null}
			{dueTodayCount > 0 ? (
				<span
					aria-hidden={true}
					className={cn(
						reviewStatusDotVariants({ size, tone: "info", surfaceContext }),
						isStacked && "relative z-[2]"
					)}
					data-testid={
						testIdPrefix ? `${testIdPrefix}-due-today-dot` : undefined
					}
				/>
			) : null}
			{pendingCount > 0 ? (
				<span
					aria-hidden={true}
					className={cn(
						reviewStatusDotVariants({
							size,
							tone: neutralVariant === "solid" ? "neutral-solid" : "neutral",
							surfaceContext
						}),
						isStacked && "relative z-[1]"
					)}
					data-testid={testIdPrefix ? `${testIdPrefix}-pending-dot` : undefined}
				/>
			) : null}
			<span className='sr-only'>{summary}</span>
		</span>
	)
}
