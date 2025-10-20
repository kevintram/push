import { Link } from '@tanstack/react-router'
import { MoreHorizontal, Plus, X } from 'lucide-react'
import { type ReactNode, useCallback, useContext, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import type { Tables } from '~/types/database.types'
import { AddTopicToTodoDialog } from './AddTopicToTodoDialog'
import { TimelineDataContext } from './TimelineDataContext'

interface TodoTopicsDropdownProps {
	isOpen: boolean
	onOpenChange: (open: boolean) => void
	todoId: number | undefined
	topics: Array<Tables<'topics'>>
	trigger: ReactNode
	side?: 'top' | 'right' | 'bottom' | 'left'
	align?: 'start' | 'center' | 'end'
	onRemoveTopicFromTodo?: (todoId: number, topicId: number) => Promise<void>
}

export function TodoTopicsDropdown({
	isOpen,
	onOpenChange,
	todoId,
	topics,
	trigger,
	side = 'bottom',
	align = 'start',
	onRemoveTopicFromTodo
}: TodoTopicsDropdownProps) {
	const [showAddDialog, setShowAddDialog] = useState(false)

	// Try to get removeTopicFromTodo from context, but fall back to prop
	const timelineData = useContext(TimelineDataContext)
	const removeTopicFromTodo =
		onRemoveTopicFromTodo || timelineData?.removeTopicFromTodo

	const handleRemoveTopic = useCallback(
		async (topicId: number) => {
			if (!(todoId && removeTopicFromTodo)) return
			await removeTopicFromTodo(todoId, topicId)
		},
		[todoId, removeTopicFromTodo]
	)

	const handleAddTopic = useCallback(() => {
		setShowAddDialog(true)
	}, [])

	return (
		<>
			<Popover onOpenChange={onOpenChange} open={isOpen}>
				<PopoverTrigger asChild={true}>{trigger}</PopoverTrigger>
				<PopoverContent
					align={align}
					className='w-80 p-3'
					side={side}
					sideOffset={5}
				>
					<div className='flex h-64 flex-col'>
						<div className='mb-3 flex items-center justify-between'>
							<span className='font-medium text-muted-foreground text-sm'>
								Topics
							</span>
							<div className='flex items-center gap-2'>
								<Button
									className='h-6 w-6 p-0'
									onClick={handleAddTopic}
									size='sm'
									variant='ghost'
								>
									<Plus className='h-3 w-3' />
								</Button>
							</div>
						</div>
						<div className='flex flex-1 flex-col gap-2 overflow-y-auto'>
							{/* Topic list */}
							{topics?.map(topic => (
								<TopicCard
									key={topic.id}
									onRemove={() => handleRemoveTopic(topic.id)}
									topic={topic}
								/>
							))}
						</div>
					</div>
				</PopoverContent>
			</Popover>

			<AddTopicToTodoDialog
				onOpenChange={setShowAddDialog}
				open={showAddDialog}
				todoId={todoId}
			/>
		</>
	)
}

interface TopicCardProps {
	topic: Tables<'topics'>
	onRemove: () => void
}

function TopicCard({ topic, onRemove }: TopicCardProps) {
	return (
		<Card className='group relative cursor-pointer p-0 transition-colors hover:bg-muted/50'>
			<Link params={{ topicId: topic.id.toString() }} to='/topics/{-$topicId}'>
				<CardContent className='px-2 py-1.5'>
					<h3 className='line-clamp-2 font-medium text-xs'>{topic.name}</h3>
				</CardContent>
			</Link>
			<div className='absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100'>
				<DropdownMenu>
					<DropdownMenuTrigger asChild={true}>
						<Button
							className='h-4 w-4 p-0'
							onClick={e => e.preventDefault()}
							variant='ghost'
						>
							<MoreHorizontal className='h-2 w-2' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='center' side='bottom' sideOffset={2}>
						<DropdownMenuItem
							className='text-red-600 focus:text-red-600'
							onClick={e => {
								e.preventDefault()
								onRemove()
							}}
						>
							<X className='mr-2 h-3 w-3' />
							Remove
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</Card>
	)
}
