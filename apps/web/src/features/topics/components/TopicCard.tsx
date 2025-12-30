import { useQueryClient } from '@tanstack/react-query'
import {
	Archive,
	Baby,
	BookOpen,
	Calendar,
	Inbox,
	Sparkles,
	User2
} from 'lucide-react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { useCallback, useMemo } from 'react'
import { BookOpenOff } from '~/components/icons'
import { Badge } from '~/components/ui/Badge'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/Card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import { useTopicMetrics } from '~/features/topics/hooks/useTopicMetrics'
import type { Topic } from '~/features/topics/types/topic.types'
import { prefetchTopicRelations } from '~/features/topics/utils/prefetchTopicRelations'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'

const MIN_HEIGHT = 96

interface TopicCardProps {
	topic: Topic
	onTopicClick?: (topic: Topic) => void
	minHeight?: number
	searchQuery?: string
	headerRight?: React.ReactNode
	/** Whether to show the "leaving soon" badge in the header. Defaults to false. */
	showLeavingSoon?: boolean
}

export function TopicCard({
	topic,
	onTopicClick,
	minHeight = MIN_HEIGHT,
	searchQuery,
	headerRight,
	showLeavingSoon = false
}: TopicCardProps) {
	const queryClient = useQueryClient()
	const { mutate: updateTopic, isPending: isUpdatingTopic } = useUpdateTopic()

	const { bucketInfo, isNewTopic, isLeavingSoon } = useTopicMetrics(topic)

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(topic.last_reviewed_at, {
				includeFuture: false,
				nullLabel: 'never'
			}),
		[topic.last_reviewed_at]
	)

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
		prefetchTopicRelations(queryClient, topic)
	}, [queryClient, topic])

	const handleSrsToggle = useCallback(
		(e: MouseEvent) => {
			e.stopPropagation()
			updateTopic({
				id: topic.id,
				srs_enabled: !topic.srs_enabled
			})
		},
		[updateTopic, topic.id, topic.srs_enabled]
	)

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
				<div className='flex items-center gap-1 text-muted-foreground text-xs'>
					<User2 className='h-3 w-3' />
					<span>{topic.parents?.length ?? 0}</span>
				</div>
				<div className='flex-1' />
				{/* Leaving soon badge */}
				{showLeavingSoon && isLeavingSoon && (
					<Badge className='h-5 text-xs' variant='destructive'>
						leaving soon
					</Badge>
				)}
				{/* SRS toggle */}
				<div
					className={isUpdatingTopic ? 'opacity-50' : 'cursor-pointer'}
					onClick={handleSrsToggle}
					onKeyDown={e => e.stopPropagation()}
				>
					{(topic.srs_enabled ?? true) ? (
						<BookOpen className='h-4 w-4 text-green-500' />
					) : (
						<BookOpenOff className='h-4 w-4 text-muted-foreground' />
					)}
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

			{/* Bottom row: Status info and Children */}
			<CardFooter className='gap-1 text-muted-foreground text-xs'>
				{isNewTopic ? (
					<div className='flex items-center gap-1'>
						<Sparkles className='h-3 w-3' />
						<span>New</span>
					</div>
				) : (
					<>
						{/* Bucket with tooltip */}
						{bucketInfo.tooltip ? (
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<div className='flex items-center gap-1'>
										<BookOpen className='h-3 w-3' />
										<span>
											{bucketInfo.label}
											{bucketInfo.days !== null &&
												` (${bucketInfo.days}d ${bucketInfo.suffix})`}
										</span>
									</div>
								</TooltipTrigger>
								<TooltipContent side='top'>{bucketInfo.tooltip}</TooltipContent>
							</Tooltip>
						) : (
							<span>{bucketInfo.label}</span>
						)}
						{/* Last reviewed */}
						<span>·</span>
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<div className='flex items-center gap-1'>
									<Calendar className='h-3 w-3' />
									<span>{lastReviewed.text.toLowerCase()}</span>
								</div>
							</TooltipTrigger>
							<TooltipContent side='top'>
								Last reviewed {lastReviewed.tooltipText.toLowerCase()}
							</TooltipContent>
						</Tooltip>
					</>
				)}
				<div className='flex-1' />
				{/* Children count */}
				<div className='flex items-center gap-1'>
					<Baby className='h-3 w-3' />
					<span>{topic.children?.length ?? 0}</span>
				</div>
			</CardFooter>
		</Card>
	)
}
