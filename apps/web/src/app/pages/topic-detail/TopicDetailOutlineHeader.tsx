import { Loader, Minimize2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'

const OUTLINE_LABEL = 'topics'
const COLLAPSE_OUTLINE_LABEL = 'Collapse outline'
const ADD_TOPIC_LABEL = 'Add topic'

interface TopicDetailOutlineHeaderProps {
	isUpdatingTopic: boolean
	onAdd: () => Promise<void>
	onCollapseAll: () => void
	onScrollToTop: () => void
}

export function TopicDetailOutlineHeader({
	isUpdatingTopic,
	onAdd,
	onCollapseAll,
	onScrollToTop
}: TopicDetailOutlineHeaderProps) {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const addTopicLabel = isSubmitting ? 'Creating topic' : ADD_TOPIC_LABEL

	return (
		<div className='flex min-h-8 items-center justify-between gap-2 rounded-md px-1.5 text-sm'>
			<button
				className='cursor-pointer truncate font-semibold text-accent-foreground/60 text-sm uppercase tracking-wide hover:text-accent-foreground'
				onClick={onScrollToTop}
				type='button'
			>
				{OUTLINE_LABEL}
			</button>
			<div className='flex items-center gap-0.5'>
				<Button
					aria-label={COLLAPSE_OUTLINE_LABEL}
					className='rounded-md'
					onClick={onCollapseAll}
					size='icon-xs'
					type='button'
					variant='ghost'
				>
					<Minimize2 />
					<span className='sr-only'>{COLLAPSE_OUTLINE_LABEL}</span>
				</Button>
				<Button
					aria-label={addTopicLabel}
					className='rounded-md'
					disabled={isUpdatingTopic || isSubmitting}
					onClick={() => {
						setIsSubmitting(true)
						onAdd().finally(() => {
							setIsSubmitting(false)
						})
					}}
					size='icon-xs'
					type='button'
					variant='ghost'
				>
					{isSubmitting ? <Loader className='animate-spin' /> : <Plus />}
					<span className='sr-only'>{addTopicLabel}</span>
				</Button>
			</div>
		</div>
	)
}
