import dayjs from 'dayjs'
import { Calendar, EllipsisVertical } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger
} from '~/components/ui/HoverCard'
import type { Rating, Topic } from '~/models/review-topic.types'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'
import { TopicReviewStatusButton } from './ReviewStatusButton'

interface AddTopicCardProps {
	topic: Topic
	onTopicClick: (topic: Topic) => void
	onCardClick?: (topic: Topic) => void
	onRemoveClick?: (topic: Topic) => void
	searchQuery?: string
	minHeight?: number
	isAdded?: boolean
	onRemoveRelationship?: () => void
	// Rating props for completed reviews
	rating?: Rating | null
	topicReviewId?: number
	onRatingChange?: (topicReviewId: number, rating: Rating) => void
	isReviewCompleted?: boolean
}

export function AddTopicCard({
	topic,
	onTopicClick,
	onCardClick,
	onRemoveClick,
	searchQuery,
	minHeight = 72,
	isAdded = false,
	onRemoveRelationship,
	rating,
	topicReviewId,
	onRatingChange,
	isReviewCompleted = false
}: AddTopicCardProps) {
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

	// Due date formatting
	const dueDateDisplay = useMemo(() => {
		if (!topic.due) return null

		const now = dayjs().startOf('day')
		const dueDayjs = dayjs(topic.due).startOf('day')
		const diffDays = dueDayjs.diff(now, 'day')
		const isUpcoming = dueDayjs.isAfter(now)

		let displayText: string
		if (diffDays === 0) {
			displayText = 'Today'
		} else if (diffDays === 1) {
			displayText = 'Tomorrow'
		} else if (diffDays === -1) {
			displayText = 'Yesterday'
		} else if (isUpcoming) {
			displayText = `in ${diffDays}d`
		} else {
			displayText = `${Math.abs(diffDays)}d ago`
		}

		return {
			dueDate: topic.due,
			isUpcoming,
			displayText
		}
	}, [topic.due])

	const dueDateColorClass = useMemo(() => {
		if (!topic.srs_enabled) return 'text-muted-foreground'
		if (dueDateDisplay?.displayText === 'Today') {
			return 'text-blue-600 dark:text-blue-400'
		}
		if (
			dueDateDisplay?.displayText === 'Yesterday' ||
			dueDateDisplay?.displayText.includes('ago')
		) {
			return 'text-red-600 dark:text-red-400'
		}
		return 'text-foreground'
	}, [topic.srs_enabled, dueDateDisplay?.displayText])

	// Click handlers
	const handleAdd = useCallback(() => {
		onTopicClick(topic)
	}, [onTopicClick, topic])

	const handleRemove = useCallback(() => {
		onRemoveClick?.(topic)
	}, [onRemoveClick, topic])

	const handleRatingChange = useCallback(
		(newRating: Rating) => {
			if (topicReviewId && onRatingChange) {
				onRatingChange(topicReviewId, newRating)
			}
		},
		[topicReviewId, onRatingChange]
	)

	const handleCardClick = useCallback(() => {
		if (onCardClick) {
			onCardClick(topic)
		}
	}, [onCardClick, topic])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault()
				handleCardClick()
			}
		},
		[handleCardClick]
	)

	return (
		<Card
			className='cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleCardClick}
			onKeyDown={handleKeyDown}
			style={{ minHeight: `${minHeight}px` }}
			tabIndex={0}
		>
			<CardHeader className='-top-1 -left-1 relative flex items-start justify-between gap-2'>
				<div className='flex items-center gap-2'>
					<TopicReviewStatusButton
						isAdded={isAdded}
						isReviewCompleted={isReviewCompleted}
						onAdd={handleAdd}
						onRatingChange={handleRatingChange}
						onRemove={handleRemove}
						rating={rating}
					/>
				</div>
				{onRemoveRelationship && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button
								className='h-6 w-6 p-0 text-muted-foreground'
								onClick={e => e.stopPropagation()}
								size='sm'
								title='More actions'
								variant='ghost'
							>
								<EllipsisVertical className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem
								onClick={e => {
									e.stopPropagation()
									onRemoveRelationship()
								}}
							>
								Remove as child
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</CardHeader>
			<CardContent className='mb-3 flex flex-1 flex-col gap-0.5'>
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
			</CardContent>
			{/* Bottom row: Due date */}
			<CardFooter className='text-muted-foreground text-xs'>
				<HoverCard openDelay={300}>
					<HoverCardTrigger asChild={true}>
						<div className='flex items-center gap-1'>
							<Calendar className={`h-3 w-3 ${dueDateColorClass}`} />
							<span className={dueDateColorClass}>
								{dueDateDisplay ? dueDateDisplay.displayText : 'None'}
							</span>
						</div>
					</HoverCardTrigger>
					<HoverCardContent className='w-auto p-3' side='bottom'>
						<div className='flex flex-col gap-1'>
							<div className='font-semibold text-sm'>
								{dueDateDisplay
									? `Due on ${dayjs(dueDateDisplay.dueDate).format('MMMM D, YYYY')}`
									: 'No due date set'}
							</div>
							<p className='text-muted-foreground text-xs'>
								{topic.srs_enabled ? 'SRS Enabled' : 'SRS Disabled'}
							</p>
						</div>
					</HoverCardContent>
				</HoverCard>
			</CardFooter>
		</Card>
	)
}
