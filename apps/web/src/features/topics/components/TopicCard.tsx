import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
	Archive,
	ArchiveRestore,
	Baby,
	Calendar,
	GitPullRequestClosed,
	Inbox,
	MoreHorizontal,
	Trash2,
	User2
} from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import type { Todo, Topic } from '~/models/todo-topic.types'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'
import { deleteTopic as deleteTopicApi } from '../api/deleteTopic'
import { updateTopic as updateTopicApi } from '../api/updateTopic'

const MIN_HEIGHT = 96

interface TopicCardProps {
	topic: Topic
	onTopicClick?: (topic: Topic) => void
	onRemoveRelationship?: () => void
	minHeight?: number
	searchQuery?: string
	todos?: Array<Todo>
}

export function TopicCard({
	topic,
	todos: todosProp,
	onTopicClick,
	onRemoveRelationship,
	minHeight = MIN_HEIGHT,
	searchQuery // for topic card in search dialog to support highlighting and shit
}: TopicCardProps) {
	const queryClient = useQueryClient()

	const { mutateAsync: deleteTopicMutation } = useMutation({
		mutationFn: deleteTopicApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['topics'] })
		}
	})

	const { mutateAsync: updateTopicMutation } = useMutation({
		mutationFn: updateTopicApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['topics'] })
		}
	})

	const parentCount = topic.parents?.length ?? 0
	const childCount = topic.children?.length ?? 0

	const todos = todosProp ?? []

	// Calculate the next or last review date
	const reviewDate = useMemo(() => {
		if (todos.length === 0) return null

		const now = dayjs()
		const todosWithDates = todos.filter(todo => todo.effective_date != null)

		if (todosWithDates.length === 0) return null

		// Find next upcoming date
		const upcomingTodos = todosWithDates
			.filter(todo => dayjs(todo.effective_date).isAfter(now))
			.sort(
				(a, b) =>
					dayjs(a.effective_date).valueOf() - dayjs(b.effective_date).valueOf()
			)

		if (upcomingTodos.length > 0 && upcomingTodos[0]) {
			return {
				date: upcomingTodos[0].effective_date!,
				isUpcoming: true
			}
		}

		// Find last past date
		const pastTodos = todosWithDates.sort(
			(a, b) =>
				dayjs(b.effective_date).valueOf() - dayjs(a.effective_date).valueOf()
		)

		if (pastTodos.length > 0 && pastTodos[0]) {
			return {
				date: pastTodos[0].effective_date!,
				isUpcoming: false
			}
		}

		return null
	}, [todos])

	const handleActivate = useCallback(() => {
		onTopicClick?.(topic)
	}, [onTopicClick, topic])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onTopicClick?.(topic)
			}
		},
		[onTopicClick, topic]
	)

	const handleDeleteTopic = () => {
		deleteTopicMutation(topic.id)
	}

	const handleArchiveToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateTopicMutation({
				id: topic.id,
				archived: !topic.archived
			})
		},
		[updateTopicMutation, topic.id, topic.archived]
	)

	const handleInboxToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateTopicMutation({
				id: topic.id,
				inboxed: !topic.inboxed
			})
		},
		[updateTopicMutation, topic.id, topic.inboxed]
	)

	return (
		<Card
			className='group relative cursor-pointer p-0 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			role='button'
			tabIndex={0}
		>
			<CardContent
				className='flex h-full flex-col justify-between gap-3 px-3 py-3'
				style={{ minHeight: `${minHeight}px` }}
			>
				<div className='flex flex-col gap-2.5'>
					{/* Top row: Parent count and menu */}
					<div className='flex items-center justify-between'>
						{/* Parents count - top left */}
						<Popover>
							<PopoverTrigger asChild={true}>
								<div
									className='flex cursor-pointer items-center gap-1 text-muted-foreground text-xs hover:text-foreground'
									onClick={e => e.stopPropagation()}
								>
									<User2 className='h-3 w-3' />
									<span>{parentCount}</span>
								</div>
							</PopoverTrigger>
							<PopoverContent
								align='start'
								className='w-64 p-3'
								onClick={e => e.stopPropagation()}
								onKeyDown={e => e.stopPropagation()}
								side='top'
							>
								<div className='flex flex-col gap-2'>
									<h4 className='font-semibold text-sm'>Parent Topics</h4>
									{parentCount === 0 ? (
										<p className='text-muted-foreground text-xs'>No parents</p>
									) : (
										<ul className='flex flex-col gap-1.5'>
											{(topic.parents ?? []).map(parent => (
												<li
													className='break-words text-sm leading-tight '
													key={parent.id}
												>
													{parent.name || parent.notes || 'Untitled'}
												</li>
											))}
										</ul>
									)}
								</div>
							</PopoverContent>
						</Popover>

						{/* Menu - top right */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild={true}>
								<Button
									className='h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100'
									onClick={e => e.stopPropagation()}
									variant='ghost'
								>
									<MoreHorizontal className='h-3 w-3' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' side='bottom' sideOffset={2}>
								<DropdownMenuItem onClick={handleInboxToggle}>
									{topic.inboxed ? (
										<>
											<Inbox className='mr-2 h-4 w-4' />
											Remove from Inbox
										</>
									) : (
										<>
											<Inbox className='mr-2 h-4 w-4' />
											Add to Inbox
										</>
									)}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleArchiveToggle}>
									{topic.archived ? (
										<>
											<ArchiveRestore className='mr-2 h-4 w-4' />
											Unarchive
										</>
									) : (
										<>
											<Archive className='mr-2 h-4 w-4' />
											Archive
										</>
									)}
								</DropdownMenuItem>
								{onRemoveRelationship && (
									<DropdownMenuItem
										onClick={e => {
											e.stopPropagation()
											onRemoveRelationship()
										}}
									>
										<GitPullRequestClosed className='mr-2 h-4 w-4' />
										Remove as Child
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									onClick={e => {
										e.stopPropagation()
										handleDeleteTopic()
									}}
									variant='destructive'
								>
									<Trash2 className='mr-2 h-4 w-4' />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className='flex flex-col gap-1'>
						{/* Inbox/Archive indicators */}
						{(topic.inboxed || topic.archived) && (
							<div className='flex items-center gap-2 text-muted-foreground text-xs'>
								{topic.inboxed && (
									<div className='flex items-center gap-1'>
										<Inbox className='h-3 w-3' />
										<span>Inbox</span>
									</div>
								)}
								{topic.archived && (
									<div className='flex items-center gap-1'>
										<Archive className='h-3 w-3' />
										<span>Archived</span>
									</div>
								)}
							</div>
						)}

						{/* The Actual Content */}
						<div className='flex flex-col gap-0.5'>
							{topic.name && (
								<h3 className='break-word font-semibold leading-tight [overflow-wrap:anywhere]'>
									{searchQuery
										? highlightText({ text: topic.name, query: searchQuery })
										: topic.name}
								</h3>
							)}
							{topic.notes && (
								<p className='break-word text-sm [overflow-wrap:anywhere]'>
									{searchQuery
										? truncateWithHighlight(topic.notes, searchQuery, 150)
										: topic.notes}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Bottom row: Review date and children count */}
				<div className='flex items-center justify-between text-muted-foreground text-xs'>
					{/* Review date - bottom left */}
					<div className='flex items-center gap-1'>
						<Calendar className='h-3 w-3' />
						{reviewDate ? (
							<span className={reviewDate.isUpcoming ? '' : 'opacity-60'}>
								{reviewDate.isUpcoming
									? `in ${dayjs(reviewDate.date).diff(dayjs(), 'day')} days`
									: `${dayjs().diff(dayjs(reviewDate.date), 'day')} days ago`}
							</span>
						) : (
							<span>None</span>
						)}
					</div>

					{/* Children count - bottom right */}
					<Popover>
						<PopoverTrigger asChild={true}>
							<div
								className='flex cursor-pointer items-center gap-1 hover:text-foreground'
								onClick={e => e.stopPropagation()}
							>
								<Baby className='h-3 w-3' />
								<span>{childCount}</span>
							</div>
						</PopoverTrigger>
						<PopoverContent
							align='end'
							className='w-64 p-3'
							onClick={e => e.stopPropagation()}
							onKeyDown={e => e.stopPropagation()}
							side='bottom'
						>
							<div className='flex flex-col gap-2'>
								<h4 className='font-semibold text-sm'>Child Topics</h4>
								{childCount === 0 ? (
									<p className='text-muted-foreground text-xs'>No children</p>
								) : (
									<ul className='flex flex-col gap-1.5'>
										{(topic.children ?? []).map(child => (
											<li
												className='break-words text-sm leading-tight'
												key={child.id}
											>
												{child.name || child.notes || 'Untitled'}
											</li>
										))}
									</ul>
								)}
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</CardContent>
		</Card>
	)
}
