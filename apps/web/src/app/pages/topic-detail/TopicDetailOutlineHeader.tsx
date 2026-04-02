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
				className='cursor-pointer truncate font-black text-accent-foreground/60 text-sm uppercase tracking-wider hover:text-accent-foreground'
				onClick={onScrollToTop}
				type='button'
			>
				{OUTLINE_LABEL}
			</button>
			<div className='flex items-center gap-0.5'>
				<Button
					aria-label={COLLAPSE_OUTLINE_LABEL}
					className='h-5 w-5 rounded-md p-0'
					onClick={onCollapseAll}
					size='icon-xs'
					type='button'
					variant='ghost'
				>
					<Minimize2 className='h-4 w-4' />
					<span className='sr-only'>{COLLAPSE_OUTLINE_LABEL}</span>
				</Button>
				<Button
					aria-label={addTopicLabel}
					className='h-5 w-5 rounded-md p-0'
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
					{isSubmitting ? (
						<Loader className='h-4 w-4 animate-spin' />
					) : (
						<Plus className='h-4 w-4' />
					)}
					<span className='sr-only'>{addTopicLabel}</span>
				</Button>
			</div>
		</div>
	)
}
