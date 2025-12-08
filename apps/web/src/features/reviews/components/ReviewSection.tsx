import { ChevronDown } from 'lucide-react'
import { useCallback } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Review, Topic } from '~/models/review-topic.types'
import { ReviewItem } from './ReviewItem'

const MIN_TOPIC_WIDTH = 280
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
					<h2 className={`font-bold text-lg ${headingClassName ?? ''}`.trim()}>
						{label}
					</h2>
					<ChevronDown
						className={`h-5 w-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
					/>
				</Button>
			</div>

			{!isCollapsed && (
				<div className='mt-2 mb-10 ml-5 grid grid-cols-1 gap-4 border-border border-l-2 pl-4 md:grid-cols-2'>
					{/* Reviews Subsection */}
					<div className='flex flex-col gap-2'>
						<h3 className='font-semibold text-md'>
							Reviews{' '}
							<span className='text-muted-foreground'>
								({reviewEntries.length})
							</span>
						</h3>
						<div>
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
					</div>

					{/* Topics Subsection */}
					<div className='flex flex-col gap-2'>
						<h3 className='font-semibold text-md'>
							Topics{' '}
							<span className='text-muted-foreground'>
								({topicEntries.length})
							</span>
						</h3>
						<div>
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
					</div>
				</div>
			)}
		</div>
	)
}
