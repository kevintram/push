import {
	Baby,
	ChevronDown,
	MoreHorizontal,
	RotateCcw,
	Users2
} from 'lucide-react'
import { memo, use, useState } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Progress } from '~/components/ui/Progress'
import { cn } from '~/lib/utils'
import type { Topic } from '~/types/topics.types'
import { SelectedTopicContext } from '../stores/SelectedTopicContext'
import { numDaysElapsedFrom } from '../utils/daysElapsed'
import { getRetrievabilityColorClass } from '../utils/getRetrievabilityColor'

/**
 * Created this to avoid re-rendering BasicTopicListItem when
 * the selected topic changes (BasicTopicListItem is memoized).
 */
export function TopicListItem({ topic }: { topic: Topic }) {
	const { selectedTopic, setSelectedTopic } = use(SelectedTopicContext)
	const isSelected = topic.id === selectedTopic?.id

	const [isExpanded, setIsExpanded] = useState(true)

	return (
		<div className='space-y-0.5'>
			<div
				className={cn(
					isSelected && 'bg-primary/10 text-primary',
					'rounded-md py-2 pl-3 transition-colors hover:bg-muted/50'
				)}
				onClick={() => setSelectedTopic(topic)}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						setSelectedTopic(topic)
					}
				}}
				role='button'
				tabIndex={0}
			>
				<BasicTopicListItem
					isExpanded={isExpanded}
					setIsExpanded={setIsExpanded}
					topic={topic}
				/>
			</div>
			{topic.children.length > 0 && isExpanded && (
				<div className='relative ml-4'>
					<div
						className='absolute bg-muted-foreground/30'
						style={{
							top: '0px',
							width: '1px',
							height: '100%'
						}}
					/>
					{topic.children.map(child => (
						<TopicListItem key={child.id} topic={child} />
					))}
				</div>
			)}
		</div>
	)
}

const BasicTopicListItem = memo(
	({
		topic,
		isExpanded,
		setIsExpanded
	}: {
		topic: Topic
		isExpanded: boolean
		setIsExpanded: (isExpanded: boolean) => void
	}) => {
		const lastReviewDate = topic.timeline_entries?.at(-1)?.review_date
		const daysSinceLastEntry = lastReviewDate
			? numDaysElapsedFrom(new Date(lastReviewDate))
			: 0

		return (
			<div
				className={cn('group flex flex-col gap-1')}
				// style={{ paddingLeft: `${level * 16 + 12}px` }}
			>
				{/* Topic content */}
				<div className='flex flex-col gap-1'>
					<div className='flex items-start justify-between gap-3'>
						<div className='min-w-0 flex-1'>
							<div className='break-words font-medium text-sm'>
								{topic.name}
							</div>
							<div className='flex items-center gap-1 text-muted-foreground text-xs'>
								<span
									className={cn(
										'font-bold text-xs',
										getRetrievabilityColorClass(topic.retrievability)
									)}
								>
									{(topic.retrievability * 100).toFixed(0)}%
								</span>
								<span className='font-bold'> · </span>
								<RotateCcw className='h-3 w-3' />
								{daysSinceLastEntry === 0 || Number.isNaN(daysSinceLastEntry)
									? 'never'
									: `${daysSinceLastEntry}d ago`}
							</div>
							<div className='mt-1 flex items-center gap-2'>
								<Progress
									className='h-1 w-12'
									max={365}
									value={topic.stability}
								/>
								<div className='font-medium text-muted-foreground text-xs'>
									{topic.stability}d
								</div>
							</div>
						</div>

						{/* More options in top right */}
						<div className='flex-shrink-0'>
							<DropdownMenu>
								<DropdownMenuTrigger asChild={true}>
									<Button
										className='h-6 w-6 p-0'
										onClick={e => e.stopPropagation()}
										size='sm'
										title='More options'
										variant='ghost'
									>
										<MoreHorizontal className='h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem disabled={true}>
										Implement later
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>

				{/* Parent and Children Buttons */}
				<div className='flex items-center justify-end gap-0.5'>
					{/* Parents Button */}
					<Button
						className={cn(
							'flex h-6 items-center gap-0.5 p-0',
							topic.parents.length > 0 ? 'w-8 px-1' : 'w-6'
						)}
						onClick={_e => {}}
						size='sm'
						title={
							topic.parents.length > 0
								? `Go to first parent: ${topic.parents[0]}`
								: 'No parent topics'
						}
						variant='ghost'
					>
						<Users2
							className={cn(
								'h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4',
								topic.parents.length === 0 && 'opacity-50'
							)}
						/>
						{topic.parents.length > 0 && (
							<span className='font-medium text-xs'>
								{topic.parents.length}
							</span>
						)}
					</Button>

					<div className='w-1' />

					{/* Children Button */}
					<Button
						className='flex h-6 w-12 items-center gap-0.5 p-0 px-1'
						onClick={e => {
							e.stopPropagation()
							if (topic.children.length > 0) {
								setIsExpanded(!isExpanded)
							}
						}}
						size='sm'
						title={
							topic.children.length > 0
								? isExpanded
									? 'Collapse children'
									: 'Expand children'
								: 'No children'
						}
						variant='ghost'
					>
						<Baby
							className={cn(
								'h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4',
								topic.children.length === 0 && 'opacity-50'
							)}
						/>
						{topic.children.length > 0 && (
							<span className='font-medium text-xs'>
								{topic.children.length}
							</span>
						)}
						<ChevronDown
							className={cn(
								'h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4',
								!isExpanded && '-rotate-90',
								topic.children.length === 0 && 'opacity-50'
							)}
						/>
					</Button>
				</div>
			</div>
		)
	}
)
