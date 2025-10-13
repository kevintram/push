import {
	useDeleteMutation,
	useQuery,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
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
import { useTopicRelationshipCounts } from '~/features/topic-hub/hooks/useTopicRelationshipCounts'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'

type TodoWithEffectiveDate = Tables<'todos_with_effective_date'>

const MIN_HEIGHT = 96

interface TopicCardProps {
	topic: Topic
	onTopicClick?: (topic: Topic) => void
	onRemoveRelationship?: () => void
	minHeight?: number
}

export function TopicCard({
	topic,
	onTopicClick,
	onRemoveRelationship,
	minHeight = MIN_HEIGHT
}: TopicCardProps) {
	const { mutateAsync: deleteTopicMutation } = useDeleteMutation(
		supabase.from('topics'),
		['id']
	)

	const { mutateAsync: updateTopicMutation } = useUpdateMutation(
		supabase.from('topics'),
		['id'],
		'*'
	)

	// Fetch relationship counts for this topic
	const { parentCount, childCount } = useTopicRelationshipCounts(topic.id)

	// Fetch todos associated with this topic
	const { data: todos = [] } = useQuery<Array<TodoWithEffectiveDate>>(
		supabase
			.from('todos_with_effective_date')
			.select('*,todos_topics!inner(topic_id)')
			.eq('todos_topics.topic_id', topic.id)
	)

	// Calculate the next or last timeline date
	const timelineDate = useMemo(() => {
		if (todos && todos.length === 0) return null

		const now = dayjs()
		const todosWithDates =
			todos?.filter(todo => todo.effective_date != null) ?? []

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
		deleteTopicMutation({ id: topic.id })
	}

	const handleArchiveToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateTopicMutation({
				id: topic.id,
				is_archived: !topic.is_archived
			})
		},
		[updateTopicMutation, topic.id, topic.is_archived]
	)

	const handleInboxToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateTopicMutation({
				id: topic.id,
				is_inboxed: !topic.is_inboxed
			})
		},
		[updateTopicMutation, topic.id, topic.is_inboxed]
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
						<div className='flex items-center gap-1 text-muted-foreground text-xs'>
							<User2 className='h-3 w-3' />
							<span>{parentCount}</span>
						</div>

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
									{topic.is_inboxed ? (
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
									{topic.is_archived ? (
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
						{(topic.is_inboxed || topic.is_archived) && (
							<div className='flex items-center gap-2 text-muted-foreground text-xs'>
								{topic.is_inboxed && (
									<div className='flex items-center gap-1'>
										<Inbox className='h-3 w-3' />
										<span>Inbox</span>
									</div>
								)}
								{topic.is_archived && (
									<div className='flex items-center gap-1'>
										<Archive className='h-3 w-3' />
										<span>Archived</span>
									</div>
								)}
							</div>
						)}

						<div className='flex flex-col gap-0.5'>
							{topic.name && (
								<h3 className='font-semibold leading-tight'>{topic.name}</h3>
							)}
							{topic.notes && (
								<p className='line-clamp-3 text-sm'>{topic.notes}</p>
							)}
						</div>
					</div>
				</div>

				{/* Bottom row: Timeline date and children count */}
				<div className='flex items-center justify-between text-muted-foreground text-xs'>
					{/* Timeline date - bottom left */}
					<div className='flex items-center gap-1'>
						<Calendar className='h-3 w-3' />
						{timelineDate ? (
							<span className={timelineDate.isUpcoming ? '' : 'opacity-60'}>
								{timelineDate.isUpcoming
									? `in ${dayjs(timelineDate.date).diff(dayjs(), 'day')} days`
									: `${dayjs().diff(dayjs(timelineDate.date), 'day')} days ago`}
							</span>
						) : (
							<span>None</span>
						)}
					</div>

					{/* Children count - bottom right */}
					<div className='flex items-center gap-1'>
						<Baby className='h-3 w-3' />
						<span>{childCount}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
