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
import type { Topic } from '~/types/topics.types'
import { getRetrievabilityColorClass } from '../utils/getRetrievabilityColor'

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
					'group flex flex-col gap-1 rounded-md px-3 py-2 transition-colors hover:bg-muted/50',
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
							<div className='break-words font-medium text-sm'>
								{topic.title}
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
								{topic.daysSinceLastReview === 0
									? 'never'
									: `${topic.daysSinceLastReview}d ago`}
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

				{/* Action buttons at the bottom */}
				<div className='flex items-center justify-end gap-0.5'>
					{/* Parents Button */}
					<Button
						className={cn(
							'flex h-6 items-center gap-0.5 p-0',
							parentTopics.length > 0 ? 'w-8 px-1' : 'w-6'
						)}
						onClick={e => {
							e.stopPropagation()
							if (parentTopics.length > 0 && parentTopics[0]) {
								onTopicSelect(parentTopics[0])
							}
						}}
						size='sm'
						title={
							parentTopics.length > 0
								? `Go to first parent: ${parentTopics[0]?.title}`
								: 'No parent topics'
						}
						variant='ghost'
					>
						<Users2
							className={cn(
								'h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4',
								parentTopics.length === 0 && 'opacity-50'
							)}
						/>
						{parentTopics.length > 0 && (
							<span className='font-medium text-xs'>{parentTopics.length}</span>
						)}
					</Button>

					<div className='w-1' />
					
					{/* Children Button */}
					<Button
						className='flex h-6 w-12 items-center gap-0.5 p-0 px-1'
						onClick={e => {
							e.stopPropagation()
							if (childTopics.length > 0) {
								setIsExpanded(!isExpanded)
							}
						}}
						size='sm'
						title={
							childTopics.length > 0
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
								childTopics.length === 0 && 'opacity-50'
							)}
						/>
						{childTopics.length > 0 && (
							<span className='font-medium text-xs'>{childTopics.length}</span>
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

			{/* Child Topics */}
			{childTopics.length > 0 && isExpanded && (
				<div className='relative ml-4'>
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
							allTopics={allTopics}
							key={child.id}
							level={level + 1}
							onTopicSelect={onTopicSelect}
							selectedTopicId={selectedTopicId}
							topic={child}
						/>
					))}
				</div>
			)}
		</div>
	)
}
