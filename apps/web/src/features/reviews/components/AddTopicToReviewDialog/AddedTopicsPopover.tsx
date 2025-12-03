import { MasonryLayout } from '~/components/MasonryLayout'
import { Button } from '~/components/ui/Button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import type { Topic, TopicReview } from '~/models/review-topic.types'

interface AddedTopicsPopoverProps {
	addedTopicsCount: number
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	topicReviews: Array<TopicReview> | undefined
	renderItem: (topicReview: TopicReview) => React.ReactNode
	estimateItemSize: (topicReview: { topic: Topic }) => number
	getItemKey: (topicReview: { id: number }) => number
}

export function AddedTopicsPopover({
	addedTopicsCount,
	isOpen,
	onOpenChange,
	topicReviews,
	renderItem,
	estimateItemSize,
	getItemKey
}: AddedTopicsPopoverProps) {
	return (
		<Popover onOpenChange={onOpenChange} open={isOpen}>
			<PopoverTrigger asChild={true}>
				<Button
					className='px-2 font-semibold text-md'
					onClick={e => {
						e.stopPropagation()
						onOpenChange(!isOpen)
					}}
					size='default'
					variant='link'
				>
					{addedTopicsCount} topics added to review
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align='start'
				className='max-h-[500px] min-h-[350px] w-[600px] overflow-y-auto bg-background p-4'
				onClick={e => e.stopPropagation()}
				side='bottom'
			>
				{topicReviews && topicReviews.length > 0 ? (
					<MasonryLayout
						estimateItemSize={estimateItemSize}
						gap={12}
						getItemKey={getItemKey}
						items={topicReviews}
						minItemWidth={250}
						renderItem={renderItem}
					/>
				) : (
					<div className='py-8 text-center text-muted-foreground'>
						No topics
					</div>
				)}
			</PopoverContent>
		</Popover>
	)
}
