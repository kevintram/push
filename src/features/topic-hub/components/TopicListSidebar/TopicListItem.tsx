import { useDeleteMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Baby, ChevronDown, MoreHorizontal, Trash, Users2 } from 'lucide-react'
import { memo, use, useCallback, useState } from 'react'
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
import { supabase } from '~/utils/supabase'
import { TopicHubContext } from '../../stores/SelectedTopicContext'
import { getRetrievabilityColorClass } from '../../utils/getRetrievabilityColor'

export function TopicListItem({ topic }: { topic: Topic }) {
	const [isExpanded, setIsExpanded] = useState(true)

	return (
		<div>
			<MemoizedBody
				isExpanded={isExpanded}
				setIsExpanded={setIsExpanded}
				topic={topic}
			/>
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

const MemoizedBody = memo(
	({
		topic,
		isExpanded,
		setIsExpanded
	}: {
		topic: Topic
		isExpanded: boolean
		setIsExpanded: (expanded: boolean) => void
	}) => {
		const navigate = useNavigate()
		const { selectedTopic } = use(TopicHubContext)

		const { mutateAsync: deleteTopic } = useDeleteMutation(
			supabase.from('topics'),
			['id'],
			'*',
			{
				onSuccess: () => {
					if (selectedTopic?.id === topic.id) {
						navigate({
							to: '/topics/{-$topicId}',
							params: { topicId: undefined }
						})
					}
				}
			}
		)

		const handleDelete = useCallback(async () => {
			if (topic?.id) {
				await deleteTopic({ id: topic.id })
			}
		}, [deleteTopic, topic?.id])

		// TODO: reimplement this later
		// const lastReviewDate = topic.timeline_entries?.at(-1)?.review_date
		// const daysSinceLastEntry = lastReviewDate
		// 	? numDaysElapsedFrom(new Date(lastReviewDate))
		// 	: 0

		const isSelected = topic.id === selectedTopic?.id

		return (
			<Link
				className={cn(
					'group m-2 flex cursor-pointer flex-col gap-1 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/50',
					isSelected && 'bg-primary/10 text-primary'
				)}
				params={{ topicId: topic.id.toString() }}
				to='/topics/{-$topicId}'
			>
				<div className='flex items-start justify-between gap-3'>
					<div className='min-w-0 flex-1'>
						{topic.name && (
							<div className='break-wordfont-semibold text-md [overflow-wrap:anywhere]'>
								{topic.name}
							</div>
						)}

						<div className='break-word mt-1 text-sm [overflow-wrap:anywhere]'>
							{topic.notes}
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
							{/* <RotateCcw className='h-3 w-3' />
								{daysSinceLastEntry === 0 || Number.isNaN(daysSinceLastEntry)
									? 'never'
									: `${daysSinceLastEntry}d ago`} */}
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
					{/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper div to prevent event propagation to parent Link */}
					{/* biome-ignore lint/nursery/noNoninteractiveElementInteractions: wrapper div to prevent event propagation to parent Link */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper div only prevents propagation, keyboard interaction handled by child Button */}
					<div
						className='flex-shrink-0'
						onClick={e => {
							e.preventDefault()
							e.stopPropagation()
						}}
						onMouseDown={e => {
							e.preventDefault()
							e.stopPropagation()
						}}
						onPointerDown={e => {
							e.preventDefault()
							e.stopPropagation()
						}}
					>
						<DropdownMenu>
							<DropdownMenuTrigger asChild={true}>
								<Button
									className='h-6 w-6 p-0'
									size='sm'
									title='More options'
									variant='ghost'
								>
									<MoreHorizontal className='h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem onClick={handleDelete}>
									<Trash className='mr-2 h-4 w-4' />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Parent and Children Buttons */}
				{/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper div to prevent event propagation to parent Link */}
				{/* biome-ignore lint/nursery/noNoninteractiveElementInteractions: wrapper div to prevent event propagation to parent Link */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper div only prevents propagation, keyboard interaction handled by child Buttons */}
				<div
					className='flex items-center justify-end gap-1.5'
					onClick={e => {
						e.preventDefault()
						e.stopPropagation()
					}}
					onMouseDown={e => {
						e.preventDefault()
						e.stopPropagation()
					}}
					onPointerDown={e => {
						e.preventDefault()
						e.stopPropagation()
					}}
				>
					{/* Parents Button */}
					<Button
						className={cn(
							'flex h-6 items-center gap-0.5 p-0',
							topic.parents.length > 0 ? 'w-8 px-1' : 'w-6'
						)}
						onClick={() => {
							// TODO: Navigate to first parent topic
						}}
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

					{/* Children Button */}
					<Button
						className='flex h-6 w-12 items-center gap-0.5 p-0 px-1'
						onClick={() => {
							if (topic.children.length > 0) {
								setIsExpanded(!isExpanded)
							}
						}}
						size='sm'
						title={(() => {
							if (topic.children.length === 0) return 'No children'
							return isExpanded ? 'Collapse children' : 'Expand children'
						})()}
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
			</Link>
		)
	}
)
