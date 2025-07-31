import {
	Baby,
	ChevronDown,
	MoreHorizontal,
	RotateCcw,
	Users2
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Progress } from '~/components/ui/Progress'
import { cn } from '~/lib/utils'
import type { Topic } from '~/types/topic-hub'

interface TopicTreeItemProps {
	topic: Topic
	onTopicSelect: (topicItem: Topic) => void
	selectedTopicId: string
	level?: number
	allTopics?: Array<Topic> // For navigation and parent lookup
	siblings?: Array<Topic> // Topics at the same level for next/previous navigation
}

export function TopicTreeItem({
	topic,
	onTopicSelect,
	selectedTopicId,
	level = 0,
	allTopics = []
}: TopicTreeItemProps) {
	const [isExpanded, setIsExpanded] = useState(true)

	const getRetrievabilityColorClass = (retrievability: number) => {
		if (retrievability >= 85) {
			return 'text-green-600'
		}
		if (retrievability >= 75) {
			return 'text-yellow-600'
		}
		if (retrievability >= 60) {
			return 'text-orange-600'
		}
		return 'text-red-600'
	}

	// Helper function to find topic by ID in flat structure
	const findTopicById = (topics: Array<Topic>, id: string): Topic | null => {
		return topics.find(t => t.id === id) || null
	}

	// Get parent topics for this topic
	const getParentTopics = (): Array<Topic> => {
		if (!topic.parentIds?.length) return []
		return topic.parentIds
			.map(parentId => findTopicById(allTopics, parentId))
			.filter(Boolean) as Array<Topic>
	}

	// Get child topics for this topic
	const getChildTopics = (): Array<Topic> => {
		if (!topic.childIds?.length) return []
		return topic.childIds
			.map(childId => findTopicById(allTopics, childId))
			.filter(Boolean) as Array<Topic>
	}


	const parentTopics = getParentTopics()
	const childTopics = getChildTopics()

	return (
		<div className='space-y-0.5'>
			<div
				className={cn(
					'flex flex-col gap-1 py-2 px-3 rounded-md transition-colors hover:bg-muted/50 group',
					topic.id === selectedTopicId && 'bg-primary/10 text-primary'
				)}
				onClick={() => onTopicSelect(topic)}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						onTopicSelect(topic)
					}
				}}
				role='button'
				style={{ paddingLeft: `${level * 16 + 12}px` }}
				tabIndex={0}
			>
				{/* Topic content */}
				<div className='flex flex-col gap-1'>
					<div className='flex items-start justify-between gap-3'>
						<div className='min-w-0 flex-1'>
							<div className='text-sm font-medium break-words'>
								{topic.title}
							</div>
							<div className='flex items-center gap-1 text-xs text-muted-foreground'>
								<span
									className={cn(
										'text-xs font-bold',
										getRetrievabilityColorClass(topic.retrievability)
									)}
								>
									{topic.retrievability}%
								</span>
								<span className='font-bold'> · </span>
								<RotateCcw className='h-3 w-3' />
								{topic.daysSinceLastReview === 0
									? 'never'
									: `${topic.daysSinceLastReview}d ago`}
							</div>
							<div className='flex items-center gap-2 mt-1'>
								<Progress 
									value={topic.stability} 
									max={365} 
									className='w-12 h-1'
								/>
								<div className='text-xs font-medium text-muted-foreground'>
									{topic.stability}d
								</div>
							</div>
						</div>

						{/* More options in top right */}
						<div className='flex-shrink-0'>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										className='h-6 w-6 p-0'
										size='sm'
										variant='ghost'
										onClick={e => e.stopPropagation()}
										title='More options'
									>
										<MoreHorizontal className='h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem disabled>Implement later</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>

				{/* Action buttons at the bottom - always visible */}
				<div className='flex items-center justify-end gap-0.5'>
					{/* Parents/Children */}
					<Button
						className={cn(
							'h-6 p-0 flex items-center gap-0.5',
							parentTopics.length > 0 ? 'w-8 px-1' : 'w-6'
						)}
						size='sm'
						variant='ghost'
						title={
							parentTopics.length > 0
								? `Go to first parent: ${parentTopics[0]?.title}`
								: 'No parent topics'
						}
						onClick={e => {
							e.stopPropagation()
							if (parentTopics.length > 0 && parentTopics[0]) {
								onTopicSelect(parentTopics[0])
							}
						}}
					>
						<Users2
							className={cn(
								'h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4',
								parentTopics.length === 0 && 'opacity-50'
							)}
						/>
						{parentTopics.length > 0 && (
							<span className='text-xs font-medium'>{parentTopics.length}</span>
						)}
					</Button>

					<div className='w-1' />

					<Button
						className='h-6 w-12 p-0 px-1 flex items-center gap-0.5'
						size='sm'
						variant='ghost'
						title={
							childTopics.length > 0
								? isExpanded
									? 'Collapse children'
									: 'Expand children'
								: 'No children'
						}
						onClick={e => {
							e.stopPropagation()
							if (childTopics.length > 0) {
								setIsExpanded(!isExpanded)
							}
						}}
					>
						<Baby
							className={cn(
								'h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4',
								childTopics.length === 0 && 'opacity-50'
							)}
						/>
						{childTopics.length > 0 && (
							<span className='text-xs font-medium'>
								{childTopics.length}
							</span>
						)}
						<ChevronDown
							className={cn(
								'h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4',
								!isExpanded && '-rotate-90',
								childTopics.length === 0 && 'opacity-50'
							)}
						/>
					</Button>
				</div>
			</div>

			{/* Children */}
			{childTopics.length > 0 && isExpanded && (
				<div className='relative ml-4'>
					{/* Vertical connecting line */}
					<div
						className='absolute bg-muted-foreground/30'
						style={{
							left: `${level * 16 + 12}px`,
							top: '0px',
							width: '1px',
							height: '100%'
						}}
					/>
					{childTopics.map(child => (
						<TopicTreeItem
							key={child.id}
							level={level + 1}
							onTopicSelect={onTopicSelect}
							selectedTopicId={selectedTopicId}
							topic={child}
							allTopics={allTopics}
						/>
					))}
				</div>
			)}
		</div>
	)
}
