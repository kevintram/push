import { Plus, Search,	Baby,
	ChevronDown,
	MoreHorizontal,
	RotateCcw,
	Users2} from 'lucide-react'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import type { Topic } from '~/types/topics.types'
import { useState } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Progress } from '~/components/ui/Progress'
import { cn } from '~/lib/utils'
import { getRetrievabilityColorClass } from '../utils/getRetrievabilityColor'
import { numDaysElapsedFrom } from '../utils/daysElapsed'

interface TopicListSidebarProps {
	topics: Array<Topic>
	onTopicSelect: (topic: Topic) => void
	selectedTopicId: string
}

export function TopicListSidebar({
	topics,
	onTopicSelect,
	selectedTopicId
}: TopicListSidebarProps) {
	return (
		<div className='flex h-full flex-col gap-4 p-4'>
			<div className='flex items-center gap-2'>
				<div className='relative flex-1'>
					<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
					<Input className='pl-9' placeholder='Search topics...' />
				</div>
				<Button size='icon' variant='secondary'>
					<Plus className='h-4 w-4' />
				</Button>
			</div>

			<div className='flex-1 overflow-auto'>
				<div className='space-y-1'>
					{topics.map(topic => (
						<TopicTreeItem
							allTopics={topics}
							key={topic.id}
							onTopicSelect={onTopicSelect}
							selected={topic.id === selectedTopicId}
							// selectedTopicId={selectedTopicId}
							topic={topic}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

interface TopicTreeItemProps {
	topic: Topic
	onTopicSelect: (topicItem: Topic) => void
	selected: boolean
	level?: number
	allTopics?: Array<Topic> // For navigation and parent lookup
}

export function TopicTreeItem({
	topic,
	onTopicSelect,
	selected,
	level = 0,
	allTopics = []
}: TopicTreeItemProps) {

	console.log(`rerendering ${topic.title}!!`)
	const [isExpanded, setIsExpanded] = useState(true)

	const daysSinceLastReview = numDaysElapsedFrom(topic.reviewHistory[-1]?.date)


	const parents: Array<Topic> = []
	const children: Array<Topic> = []

	return (
		<div className='space-y-0.5'>
			<div
				className={cn(
					'group flex flex-col gap-1 rounded-md px-3 py-2 transition-colors hover:bg-muted/50',
					selected && 'bg-primary/10 text-primary'
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
								{daysSinceLastReview === 0
									? 'never'
									: `${daysSinceLastReview}d ago`}
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
							parents.length > 0 ? 'w-8 px-1' : 'w-6'
						)}
						onClick={e => {
							e.stopPropagation()
							if (parents.length > 0 && parents[0]) {
								onTopicSelect(parents[0])
							}
						}}
						size='sm'
						title={
							parents.length > 0
								? `Go to first parent: ${parents[0]?.title}`
								: 'No parent topics'
						}
						variant='ghost'
					>
						<Users2
							className={cn(
								'h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4',
								parents.length === 0 && 'opacity-50'
							)}
						/>
						{parents.length > 0 && (
							<span className='font-medium text-xs'>{parents.length}</span>
						)}
					</Button>

					<div className='w-1' />
					
					{/* Children Button */}
					<Button
						className='flex h-6 w-12 items-center gap-0.5 p-0 px-1'
						onClick={e => {
							e.stopPropagation()
							if (children.length > 0) {
								setIsExpanded(!isExpanded)
							}
						}}
						size='sm'
						title={
							children.length > 0
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
								children.length === 0 && 'opacity-50'
							)}
						/>
						{children.length > 0 && (
							<span className='font-medium text-xs'>{children.length}</span>
						)}
						<ChevronDown
							className={cn(
								'h-3 w-3 transition-all duration-200 group-hover:h-4 group-hover:w-4',
								!isExpanded && '-rotate-90',
								children.length === 0 && 'opacity-50'
							)}
						/>
					</Button>
				</div>
			</div>

			{/* Child Topics */}
			{/* {children.length > 0 && isExpanded && (
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
					{children.map(child => (
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
			)} */}
		</div>
	)
}

