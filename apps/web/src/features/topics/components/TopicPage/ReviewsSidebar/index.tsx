import { BicepsFlexed, Mountain } from 'lucide-react'
import { use, useCallback } from 'react'
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/Sidebar'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { TodoItem } from '~/features/todos/components/TodoItem'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { AddReviewButton } from './AddReviewButton'
import { LogNowButton } from './LogNowButton'
import { ReviewsDataProvider, useReviewsData } from './ReviewsDataContext'

function roundToTwoDecimals(num: number): number {
	return Math.round(num * 100) / 100
}

function ReviewsSidebarContent() {
	const { scheduledTodos, unscheduledTodos } = useReviewsData()
	const { openTodoDialog } = useTodoTopicDialog()
	const { topic } = use(TopicContext)

	const handleTodoClick = useCallback(
		(todoId: number) => {
			openTodoDialog(todoId)
		},
		[openTodoDialog]
	)

	return (
		<Sidebar className='absolute border-l' side='right'>
			<SidebarHeader className='flex flex-col gap-0 pb-0'>
				<div className='flex flex-row items-center justify-between'>
					<h1 className='font-semibold text-lg'>Reviews</h1>
					<div className='flex items-center gap-1'>
						<LogNowButton />
						<AddReviewButton />
					</div>
				</div>
				<div className='flex text-muted-foreground text-xs'>
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1'>
								<BicepsFlexed className='h-3 w-3' />
								<span>
									{topic?.stability != null
										? `${Math.round(topic.stability)}d`
										: 'No data'}
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='bottom'>
							{topic?.stability != null
								? `Stable for ${Math.round(topic.stability)} days`
								: 'Stability not yet calculated'}
						</TooltipContent>
					</Tooltip>
					&nbsp;·&nbsp;
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1'>
								<Mountain className='h-3 w-3' />
								<span>
									{topic?.difficulty != null
										? `${roundToTwoDecimals(topic.difficulty)}/10`
										: 'No data'}
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='bottom'>
							{topic?.difficulty != null
								? `${roundToTwoDecimals(topic.difficulty)}/10 difficulty`
								: 'Difficulty not yet calculated'}
						</TooltipContent>
					</Tooltip>
				</div>
			</SidebarHeader>
			<SidebarContent className='scrollbar-track-transparent flex h-full flex-col gap-6 overflow-auto overscroll-contain px-2 pb-2'>
				{/* Scheduled Todos Section */}
				{scheduledTodos.length > 0 && (
					<div className='flex flex-col'>
						{scheduledTodos.map(entry => (
							<TodoItem
								entry={entry}
								key={entry.id}
								onTodoClick={handleTodoClick}
							/>
						))}
					</div>
				)}

				{/* Unscheduled Todos Section */}
				{unscheduledTodos.length > 0 && (
					<div className='flex flex-col'>
						<div className='flex flex-row items-center gap-2 pt-6'>
							<h2 className='font-semibold text-sm'>Unscheduled</h2>
						</div>
						<div className='flex flex-col'>
							{unscheduledTodos.map(entry => (
								<TodoItem
									entry={entry}
									key={entry.id}
									onTodoClick={handleTodoClick}
								/>
							))}
						</div>
					</div>
				)}
			</SidebarContent>
		</Sidebar>
	)
}

export function ReviewsSidebar() {
	const { topic: selectedTopic } = use(TopicContext)

	return (
		<ReviewsDataProvider selectedTopicId={selectedTopic?.id}>
			<ReviewsSidebarContent />
		</ReviewsDataProvider>
	)
}
