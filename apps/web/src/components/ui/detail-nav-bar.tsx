import { type ReactNode, useCallback } from "react"
import { ReviewStatusDots } from "~/components/ui/review-status-dots"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"

export type DetailNavTab = "home" | "reviews"

interface DetailNavBarProps {
	leftContent?: ReactNode
	afterActions?: ReactNode
	activeTab: DetailNavTab
	onTabChange: (tab: DetailNavTab) => void
	pendingCount: number
	overdueCount: number
	dueTodayCount: number
	showReviewsTab?: boolean
}

export function DetailNavBar({
	leftContent,
	afterActions,
	activeTab,
	onTabChange,
	pendingCount,
	overdueCount,
	dueTodayCount,
	showReviewsTab = true
}: DetailNavBarProps) {
	const handleValueChange = useCallback(
		(value: string) => {
			const isSupportedTab =
				value === "home" || (showReviewsTab && value === "reviews")

			if (!isSupportedTab) {
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
								<ReviewStatusDots
									dueTodayCount={dueTodayCount}
									overdueCount={overdueCount}
									pendingCount={pendingCount}
									surfaceContext='default'
								/>
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
