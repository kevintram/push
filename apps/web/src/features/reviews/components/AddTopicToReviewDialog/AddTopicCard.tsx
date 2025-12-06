import { EllipsisVertical } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { DueDateHoverCard } from '~/components/DueDateHoverCard'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import type { Topic } from '~/models/review-topic.types'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'
import { useAddTopicToReview } from './AddTopicToReviewContext'
import { TopicReviewStatusButton } from './ReviewStatusButton'

interface AddTopicCardProps {
	topic: Topic
	onCardClick: (topic: Topic) => void
	searchQuery?: string
	onRemoveRelationship?: () => void
}

const MIN_HEIGHT = 72

export function AddTopicCard({
	topic,
	onCardClick,
	searchQuery,
	onRemoveRelationship
}: AddTopicCardProps) {
	// Get shared state from context
	const {
		isReviewCompleted,
		isTopicAdded,
		getTopicReview,
		addTopicToReview,
		removeTopicFromReview,
		updateRating
	} = useAddTopicToReview()

	const isAdded = isTopicAdded(topic.id)
	const topicReviewData = getTopicReview(topic.id)
	const rating = topicReviewData?.rating
	const topicReviewId = topicReviewData?.id
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

	// Click handlers
	const handleAdd = useCallback(() => {
		addTopicToReview(topic)
	}, [addTopicToReview, topic])

	const handleRemove = useCallback(() => {
		removeTopicFromReview(topic)
	}, [removeTopicFromReview, topic])

	const handleRatingChange = useCallback(
		(newRating: Parameters<typeof updateRating>[1]) => {
			if (topicReviewId) {
				updateRating(topicReviewId, newRating)
			}
		},
		[topicReviewId, updateRating]
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
			style={{ minHeight: `${MIN_HEIGHT}px` }}
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
				<DueDateHoverCard due={topic.due} srsEnabled={topic.srs_enabled} />
			</CardFooter>
		</Card>
	)
}
