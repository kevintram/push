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
}

export function DetailNavBar({
	leftContent,
	afterActions,
	activeTab,
	onTabChange,
	unscheduledCount,
	overdueCount,
	dueTodayCount
}: DetailNavBarProps) {
	const handleValueChange = useCallback(
		(value: string) => {
			if (value !== "home" && value !== "reviews") {
				return
			}

			onTabChange(value)
		},
		[onTabChange]
	)

	return (
		<div className='sticky top-0 z-10 w-full border-b py-1'>
			<div className='grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-2 py-1'>
				<div className='flex min-w-0 items-center gap-4'>{leftContent}</div>

				<Tabs onValueChange={handleValueChange} value={activeTab}>
					<TabsList className='h-8'>
						<TabsTrigger value='home'>Home</TabsTrigger>
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
					</TabsList>
				</Tabs>

				<div className='flex min-w-0 items-center justify-end gap-2'>
					{afterActions}
				</div>
			</div>
		</div>
	)
}
