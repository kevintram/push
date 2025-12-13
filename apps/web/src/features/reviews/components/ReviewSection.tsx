import { ChevronDown } from 'lucide-react'
import { useCallback, useState } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import type { Review } from '../types/review.types'
import { ReviewItem } from './ReviewItem'

const MIN_TOPIC_WIDTH = 210
const MIN_TOPIC_HEIGHT = 96

type ReviewSectionProps = {
	id: string
	label: string
	headingClassName?: string
	reviewEntries: Array<Review>
	topicEntries: Array<Topic>
	isCollapsed: boolean
	onToggleCollapse: (sectionId: string) => void
	onReviewClick: (reviewId: number) => void
	onTopicClick: (topic: Topic) => void
}

export function ReviewSection({
	id,
	label,
	headingClassName,
	reviewEntries,
	topicEntries,
	isCollapsed,
	onToggleCollapse,
	onReviewClick,
	onTopicClick
}: ReviewSectionProps) {
	const [reviewsCollapsed, setReviewsCollapsed] = useState(false)
	const [topicsCollapsed, setTopicsCollapsed] = useState(false)

	const estimateTopicSize = useCallback((topic: Topic) => {
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const nameHeight =
			Math.floor(topic.name.length / numCharsPerLine) * lineHeight
		const notesHeight =
			Math.floor(topic.notes.length / numCharsPerLine) * lineHeight

		const calculatedHeight = baseHeight + nameHeight + newLine + notesHeight

		return Math.max(calculatedHeight, MIN_TOPIC_HEIGHT)
	}, [])

	const renderTopicItem = useCallback(
		(topic: Topic) => {
			return (
				<TopicCard
					minHeight={MIN_TOPIC_HEIGHT}
					onTopicClick={onTopicClick}
					topic={topic}
				/>
			)
		},
		[onTopicClick]
	)

	const getTopicKey = useCallback((topic: Topic) => {
		return topic.id
	}, [])

	return (
		<div className='mb-2'>
			<div className='flex items-center justify-between'>
				<Button
					className='flex items-center gap-2 p-0'
					onClick={() => onToggleCollapse(id)}
					variant='ghost'
				>
					<h2 className={`font-bold text-xl ${headingClassName ?? ''}`.trim()}>
						{label}
					</h2>
					<ChevronDown
						className={`h-5 w-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
					/>
				</Button>
			</div>

			{!isCollapsed && (
				<div className='mt-2 mb-10 ml-5 flex flex-col gap-4 border-border border-l-2 pl-2'>
					{/* Reviews Subsection */}
					<div className='flex flex-col'>
						<Button
							className='flex w-fit items-center gap-2 p-0'
							onClick={() => setReviewsCollapsed(!reviewsCollapsed)}
							variant='ghost'
						>
							<h3 className='font-semibold text-lg'>
								Reviews{' '}
								<span className='text-muted-foreground'>
									({reviewEntries.length})
								</span>
							</h3>
							<ChevronDown
								className={`h-4 w-4 transition-transform ${reviewsCollapsed ? '-rotate-90' : ''}`}
							/>
						</Button>
						{!reviewsCollapsed && (
							<div className='px-4'>
								{reviewEntries.length > 0 ? (
									reviewEntries.map(entry => (
										<ReviewItem
											entry={entry}
											key={entry.id}
											onReviewClick={onReviewClick}
										/>
									))
								) : (
									<p className='text-muted-foreground text-sm italic'>
										No reviews
									</p>
								)}
							</div>
						)}
					</div>

					{/* Topics Subsection */}
					<div className='flex flex-col'>
						<Button
							className='flex w-fit items-center gap-2 p-0'
							onClick={() => setTopicsCollapsed(!topicsCollapsed)}
							variant='ghost'
						>
							<h3 className='font-semibold text-lg'>
								Topics{' '}
								<span className='text-muted-foreground'>
									({topicEntries.length})
								</span>
							</h3>
							<ChevronDown
								className={`h-4 w-4 transition-transform ${topicsCollapsed ? '-rotate-90' : ''}`}
							/>
						</Button>
						{!topicsCollapsed && (
							<div className='p-4 pb-0'>
								{topicEntries.length > 0 ? (
									<MasonryLayout
										estimateItemSize={estimateTopicSize}
										gap={16}
										getItemKey={getTopicKey}
										items={topicEntries}
										minItemWidth={MIN_TOPIC_WIDTH}
										overscan={5}
										renderItem={renderTopicItem}
									/>
								) : (
									<p className='text-muted-foreground text-sm italic'>
										No topics
									</p>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
