import { ArrowLeftRight, Plus, Search, User2 } from 'lucide-react'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { DetailNavBar } from '~/components/ui/detail-nav-bar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import type { ReviewCardDetailTab } from './shared'

type ReviewCardDetailHeaderProps = {
	activeTab: ReviewCardDetailTab
	dueTodayCount: number
	isTopicMenuOpen: boolean
	isTopicMutationPending: boolean
	isUpdatingReviewCard: boolean
	onCreateAndAssignTopic: () => Promise<void>
	onNavigateToTopic: () => void
	onOpenTopicSearch: () => void
	onTabChange: (tab: ReviewCardDetailTab) => void
	onTopicMenuOpenChange: (open: boolean) => void
	overdueCount: number
	parentLabel: string
	pendingCount: number
}

export function ReviewCardDetailHeader({
	activeTab,
	dueTodayCount,
	isTopicMenuOpen,
	isTopicMutationPending,
	isUpdatingReviewCard,
	onCreateAndAssignTopic,
	onNavigateToTopic,
	onOpenTopicSearch,
	onTabChange,
	onTopicMenuOpenChange,
	overdueCount,
	parentLabel,
	pendingCount
}: ReviewCardDetailHeaderProps) {
	return (
		<DetailNavBar
			activeTab={activeTab}
			dueTodayCount={dueTodayCount}
			leftContent={
				<div className='flex min-w-0 items-center gap-2'>
					<div className='flex items-center gap-1 text-muted-foreground text-xs'>
						<User2 className='size-3' />
						<span>Topic</span>
					</div>
					<Badge
						className={`group/topic h-6 rounded-full px-1 text-xs ${
							isTopicMenuOpen
								? 'bg-muted text-muted-foreground dark:bg-muted/50'
								: ''
						}`}
						variant='ghost'
					>
						<Button
							className={`h-5 cursor-pointer rounded-full px-0 font-medium text-xs leading-none ${
								isTopicMenuOpen ? 'text-muted-foreground' : ''
							}`}
							onClick={onNavigateToTopic}
							size='xs'
							type='button'
							variant='ghost'
						>
							{parentLabel}
						</Button>
						<DropdownMenu onOpenChange={onTopicMenuOpenChange}>
							<DropdownMenuTrigger
								disabled={isTopicMutationPending || isUpdatingReviewCard}
								render={
									<Button
										aria-label='Change topic'
										className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full p-0 transition-opacity ${
											isTopicMenuOpen
												? 'pointer-events-auto opacity-100'
												: 'pointer-events-none opacity-0 focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/topic:pointer-events-auto group-hover/topic:opacity-100 group-active/topic:pointer-events-auto group-active/topic:opacity-100'
										}`}
										size='icon-xs'
										type='button'
										variant='ghost'
									/>
								}
							>
								<ArrowLeftRight className='size-3' />
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' side='bottom' sideOffset={4}>
								<div className='px-2 py-1.5 font-medium text-muted-foreground text-xs'>
									Swap topic
								</div>
								<DropdownMenuItem onClick={onOpenTopicSearch}>
									<Search className='mr-2 h-4 w-4' />
									Search
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										onCreateAndAssignTopic().catch(() => {})
									}}
								>
									<Plus className='mr-2 h-4 w-4' />
									Create
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</Badge>
				</div>
			}
			onTabChange={onTabChange}
			overdueCount={overdueCount}
			pendingCount={pendingCount}
		/>
	)
}
