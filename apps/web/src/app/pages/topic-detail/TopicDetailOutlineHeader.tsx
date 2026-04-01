import { Minimize2, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'

const OUTLINE_LABEL = 'topics'
const COLLAPSE_OUTLINE_LABEL = 'Collapse outline'
const ADD_TOPIC_LABEL = 'Add topic'

interface TopicDetailOutlineHeaderProps {
	isUpdatingTopic: boolean
	onAdd: () => void
	onCollapseAll: () => void
	onScrollToTop: () => void
}

export function TopicDetailOutlineHeader({
	isUpdatingTopic,
	onAdd,
	onCollapseAll,
	onScrollToTop
}: TopicDetailOutlineHeaderProps) {
	return (
		<div className='flex min-h-8 items-center justify-between gap-2 rounded-md px-1.5 text-sm'>
			<button
				className='cursor-pointer truncate font-semibold text-accent-foreground/90 text-sm uppercase tracking-wide hover:text-accent-foreground'
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
					aria-label={ADD_TOPIC_LABEL}
					className='h-5 w-5 rounded-md p-0'
					disabled={isUpdatingTopic}
					onClick={onAdd}
					size='icon-xs'
					type='button'
					variant='ghost'
				>
					<Plus className='h-4 w-4' />
					<span className='sr-only'>{ADD_TOPIC_LABEL}</span>
				</Button>
			</div>
		</div>
	)
}
