import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
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
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { topicKeys } from '~/features/topics/api/queryKeys'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import type { Topic } from '~/features/topics/types/topic.types'
import {
	calculateDaysSinceLate,
	getRetrievabilityBucket,
	getThresholdCrossingInfo
} from '~/utils/retrievability'
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
	const parentCount = topic.parents?.length ?? 0
	const childCount = topic.children?.length ?? 0

	// Threshold crossing info for header badge and bucket days
	const thresholdInfo = useMemo(
		() =>
			getThresholdCrossingInfo(
				topic.retrievability,
				topic.stability,
				topic.last_reviewed_at
			),
		[topic.retrievability, topic.stability, topic.last_reviewed_at]
	)

	// Show "leaving soon" badge if crossing threshold within 7 days
	const isLeavingSoon = thresholdInfo && thresholdInfo.daysUntil <= 7

	// Calculate bucket info for footer display
	const bucketInfo = useMemo(() => {
		if (topic.retrievability === null) {
			return {
				label: '—',
				days: null,
				suffix: null,
				tooltip: null
			}
		}

		const bucket = getRetrievabilityBucket(topic.retrievability)

		switch (bucket) {
			case 'early': {
				const days = thresholdInfo?.daysUntil ?? 0
				return {
					label: 'Early',
					days,
					suffix: 'left',
					tooltip: `Early | ${days} day${days !== 1 ? 's' : ''} until ready`
				}
			}
			case 'onTime': {
				const days = thresholdInfo?.daysUntil ?? 0
				return {
					label: 'Ready',
					days,
					suffix: 'left',
					tooltip: `Ready | ${days} day${days !== 1 ? 's' : ''} until late`
				}
			}
			case 'late': {
				const days = calculateDaysSinceLate(
					topic.stability,
					topic.last_reviewed_at
				)
				return {
					label: 'Late',
					days,
					suffix: 'ago',
					tooltip: `Late since ${days} day${days !== 1 ? 's' : ''} ago`
				}
			}
			default:
				return bucket satisfies never
		}
	}, [
		topic.retrievability,
		topic.stability,
		topic.last_reviewed_at,
		thresholdInfo
	])

	// Format last reviewed as relative time
	const lastReviewedText = useMemo(() => {
		if (!topic.last_reviewed_at) return 'never'
		const days = dayjs().diff(dayjs(topic.last_reviewed_at), 'day')
		if (days === 0) return 'today'
		if (days === 1) return '1d ago'
		return `${days}d ago`
	}, [topic.last_reviewed_at])

	// Check if this is a truly new topic (no reviews, no inherited state)
	const isNewTopic = useMemo(() => {
		return (
			topic.retrievability === null &&
			!topic.last_reviewed_at &&
			topic.inherited_stability === null
		)
	}, [topic.retrievability, topic.last_reviewed_at, topic.inherited_stability])

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
		if (topic.parents && topic.parents.length > 0) {
			queryClient.setQueryData(topicKeys.parents(topic.id), topic.parents)
		}
		if (topic.children && topic.children.length > 0) {
			queryClient.setQueryData(topicKeys.children(topic.id), topic.children)
		}
		if (topic.related && topic.related.length > 0) {
			queryClient.setQueryData(topicKeys.related(topic.id), topic.related)
		}
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
				<div className='flex items-center gap-2'>
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
									<span className='cursor-help'>
										{bucketInfo.label}
										{bucketInfo.days !== null &&
											` (${bucketInfo.days}d ${bucketInfo.suffix})`}
									</span>
								</TooltipTrigger>
								<TooltipContent side='top'>{bucketInfo.tooltip}</TooltipContent>
							</Tooltip>
						) : (
							<span>{bucketInfo.label}</span>
						)}
						{/* Last reviewed */}
						<span>·</span>
						<div className='flex items-center gap-1'>
							<Calendar className='h-3 w-3' />
							<span>{lastReviewedText}</span>
						</div>
					</>
				)}
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
