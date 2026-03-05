import { type ReactNode, useCallback } from "react"
import { CountBadge } from "~/components/ui/count-badge"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"

export type DetailNavTab = "home" | "reviews"

interface DetailNavBarProps {
	leftContent?: ReactNode
	afterActions?: ReactNode
	activeTab: DetailNavTab
	onTabChange: (tab: DetailNavTab) => void
	unscheduledCount: number
	overdueCount: number
	dueTodayCount: number
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
	showReviewsTab = true
}: DetailNavBarProps) {
	const handleValueChange = useCallback(
		(value: string) => {
			if (value !== "home" && (showReviewsTab ? value !== "reviews" : true)) {
				return
			}

			onTabChange(value as DetailNavTab)
		},
		[onTabChange, showReviewsTab]
	)

	return (
		<div className='sticky top-0 z-10 grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-b px-2 py-1'>
			<div className='flex min-w-0 items-center gap-4'>{leftContent}</div>

			<Tabs onValueChange={handleValueChange} value={activeTab}>
				<TabsList className='h-8'>
					<TabsTrigger value='home'>Home</TabsTrigger>
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
