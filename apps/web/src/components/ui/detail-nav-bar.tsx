import { type ReactNode, useCallback } from "react"
import { CountBadge } from "~/components/ui/count-badge"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"

export type DetailNavTab = "home" | "notes" | "reviews"

interface DetailNavBarProps {
	leftContent?: ReactNode
	afterActions?: ReactNode
	activeTab: DetailNavTab
	onTabChange: (tab: DetailNavTab) => void
	unscheduledCount: number
	overdueCount: number
	dueTodayCount: number
	showNotesTab?: boolean
	showReviewsTab?: boolean
}

export function DetailNavBar({
	leftContent,
	afterActions,
	activeTab,
	onTabChange,
	unscheduledCount,
	overdueCount,
	dueTodayCount,
	showNotesTab = false,
	showReviewsTab = true
}: DetailNavBarProps) {
	const handleValueChange = useCallback(
		(value: string) => {
			const isSupportedTab =
				value === "home" ||
				(showNotesTab && value === "notes") ||
				(showReviewsTab && value === "reviews")

			if (!isSupportedTab) {
				return
			}

			onTabChange(value as DetailNavTab)
		},
		[onTabChange, showNotesTab, showReviewsTab]
	)

	return (
		<div className='sticky top-0 z-10 grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-2 py-1'>
			<div className='flex min-w-0 items-center gap-4'>{leftContent}</div>

			<Tabs onValueChange={handleValueChange} value={activeTab}>
				<TabsList className='h-8'>
					<TabsTrigger value='home'>Home</TabsTrigger>
					{showNotesTab ? <TabsTrigger value='notes'>Notes</TabsTrigger> : null}
					{showReviewsTab ? (
						<TabsTrigger value='reviews'>
							<span className='flex items-center gap-1.5'>
								Reviews
								{unscheduledCount > 0 && (
									<CountBadge count={unscheduledCount} />
								)}
								{overdueCount > 0 && (
									<CountBadge
										className='bg-red-600 text-white dark:bg-red-400'
										count={overdueCount}
									/>
								)}
								{dueTodayCount > 0 && (
									<CountBadge
										className='bg-transparent text-blue-600 dark:text-blue-400'
										count={dueTodayCount}
									/>
								)}
							</span>
						</TabsTrigger>
					) : null}
				</TabsList>
			</Tabs>

			<div className='flex min-w-0 items-center justify-end gap-2'>
				{afterActions}
			</div>
		</div>
	)
}
