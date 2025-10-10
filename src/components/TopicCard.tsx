import { useDeleteMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { useNavigate } from '@tanstack/react-router'
import {
	ExternalLink,
	GitPullRequestClosed,
	MoreHorizontal,
	Trash2
} from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

const MIN_HEIGHT = 96

interface TopicCardProps {
	topic: Tables<'topics'>
	onTopicClick?: (topic: Tables<'topics'>) => void
	onRemoveRelationship?: () => void
	minHeight?: number
}

export function TopicCard({
	topic,
	onTopicClick,
	onRemoveRelationship,
	minHeight = MIN_HEIGHT
}: TopicCardProps) {
	const navigate = useNavigate()

	const { mutateAsync: deleteTopicMutation } = useDeleteMutation(
		supabase.from('topics'),
		['id']
	)

	const handleActivate = useCallback(() => {
		onTopicClick?.(topic)
	}, [onTopicClick, topic])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onTopicClick?.(topic)
			}
		},
		[onTopicClick, topic]
	)

	const handleDeleteTopic = () => {
		deleteTopicMutation({ id: topic.id })
	}

	const handleNavigate = () => {
		navigate({
			to: '/topics/{-$topicId}',
			params: { topicId: topic.id.toString() }
		})
	}

	return (
		<Card
			className='group relative cursor-pointer p-0 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			role='button'
			tabIndex={0}
		>
			<CardContent
				className='flex h-full flex-col justify-between px-3 py-4'
				style={{ minHeight: `${minHeight}px` }}
			>
				<div className='space-y-2'>
					{topic.name && (
						<h3 className='font-semibold text-md leading-tight'>
							{topic.name}
						</h3>
					)}
					{topic.notes && <p className='line-clamp-5 text-sm'>{topic.notes}</p>}
				</div>

				<div className='flex justify-start gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
					<Button
						className='h-6 w-6 p-0'
						onClick={e => {
							e.stopPropagation()
							handleNavigate()
						}}
						variant='ghost'
					>
						<ExternalLink className='h-3 w-3' />
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button
								className='h-6 w-6 p-0'
								onClick={e => e.stopPropagation()}
								variant='ghost'
							>
								<MoreHorizontal className='h-3 w-3' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='center' side='bottom' sideOffset={2}>
							{onRemoveRelationship && (
								<DropdownMenuItem
									onClick={e => {
										e.stopPropagation()
										onRemoveRelationship()
									}}
								>
									<GitPullRequestClosed className='mr-2 h-4 w-4' />
									Remove as Child
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								className='text-red-600 focus:text-red-600'
								onClick={e => {
									e.stopPropagation()
									handleDeleteTopic()
								}}
								variant='destructive'
							>
								<Trash2 className='mr-2 h-4 w-4' />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardContent>
		</Card>
	)
}
