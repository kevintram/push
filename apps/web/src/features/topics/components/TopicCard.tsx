import { useQueryClient } from '@tanstack/react-query'
import { Archive, Baby, Inbox, User2 } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useCallback, useMemo } from 'react'
import { TopicDateDisplay } from '~/components/TopicDateDisplay'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/Card'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { topicKeys } from '~/features/topics/api/queryKeys'
import type { Topic } from '~/features/topics/types/topic.types'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'

const MIN_HEIGHT = 96

interface TopicCardProps {
	topic: Topic
	onTopicClick?: (topic: Topic) => void
	minHeight?: number
	searchQuery?: string
	headerLeft?: React.ReactNode
	headerRight?: React.ReactNode
}

export function TopicCard({
	topic,
	onTopicClick,
	minHeight = MIN_HEIGHT,
	searchQuery,
	headerLeft,
	headerRight
}: TopicCardProps) {
	const queryClient = useQueryClient()
	const parentCount = topic.parents?.length ?? 0
	const childCount = topic.children?.length ?? 0

	// Search highlighting
	const highlightedName = useMemo(() => {
		if (!topic.name) return null
		if (!searchQuery?.trim()) return topic.name
		return highlightText({ text: topic.name, query: searchQuery })
	}, [topic.name, searchQuery])

	const highlightedNotes = useMemo(() => {
		if (!topic.notes) return null
		if (!searchQuery?.trim()) return topic.notes
		return truncateWithHighlight(topic.notes, searchQuery, 200)
	}, [topic.notes, searchQuery])

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

	const handleMouseEnter = useCallback(() => {
		// Store topic in query cache for prefetching
		queryClient.setQueryData(topicKeys.detail(topic.id), topic)
	}, [queryClient, topic])

	return (
		<Card
			className='cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			onMouseEnter={handleMouseEnter}
			role='button'
			style={{ minHeight: `${minHeight}px` }}
			tabIndex={0}
		>
			<CardHeader className='-top-1 -left-1 relative flex items-start justify-between gap-2'>
				<div className='flex items-center gap-2'>
					{headerLeft}
					{/* Parents count - right of left header content (or start if empty) */}
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
							side='bottom'
						>
							<div className='flex flex-col gap-2'>
								<h4 className='font-semibold text-sm'>Parent Topics</h4>
								{parentCount === 0 ? (
									<p className='text-muted-foreground text-xs'>No parents</p>
								) : (
									<ul className='flex flex-col gap-1.5'>
										{(topic.parents ?? []).map(parent => (
											<li
												className='break-words text-sm leading-tight'
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
				</div>

				<div className='flex items-center gap-1'>{headerRight}</div>
			</CardHeader>

			<CardContent className='mb-3 flex flex-1 flex-col gap-3'>
				<div className='flex flex-col gap-1'>
					{/* Inbox/Archive indicators */}
					{(topic.inboxed || topic.archived) && (
						<div className='flex items-center gap-2 text-muted-foreground text-xs'>
							{topic.inboxed && (
								<div className='flex items-center gap-1'>
									<Inbox className='h-3 w-3' />
									<span>Inboxed</span>
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

					<div className='flex flex-col gap-0.5'>
						{highlightedName && (
							<h3 className='break-word font-semibold leading-tight [overflow-wrap:anywhere]'>
								{highlightedName}
							</h3>
						)}
						{highlightedNotes && (
							<p className='break-word text-sm [overflow-wrap:anywhere]'>
								{highlightedNotes}
							</p>
						)}
					</div>
				</div>
			</CardContent>
			{/* Bottom row: Due date and Children */}
			<CardFooter className='gap-1 text-muted-foreground text-xs'>
				<TopicDateDisplay
					due={topic.due}
					scheduledAt={topic.scheduled_at}
					srsEnabled={topic.srs_enabled}
				/>
				<div className='flex-1' />
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
			</CardFooter>
		</Card>
	)
}
