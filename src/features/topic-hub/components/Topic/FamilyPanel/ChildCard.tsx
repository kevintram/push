import { useDeleteMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { Link } from '@tanstack/react-router'
import { GitPullRequestClosed, MoreHorizontal, Trash2 } from 'lucide-react'
import { use } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useDeleteRelationship } from '~/features/topic-hub/hooks/useDeleteRelationship'
import { TopicHubContext } from '~/features/topic-hub/stores/SelectedTopicContext'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'

interface ChildCardProps {
	child: Topic
}

export function ChildCard({ child }: ChildCardProps) {
	const { selectedTopic } = use(TopicHubContext)
	const deleteRelationship = useDeleteRelationship()

	const { mutateAsync: deleteTopicMutation } = useDeleteMutation(
		supabase.from('topics'),
		['id']
	)

	const handleRemoveRelationship = () => {
		if (!selectedTopic) return
		deleteRelationship.mutate({ parent: selectedTopic.id, child: child.id })
	}

	const handleDeleteTopic = () => {
		deleteTopicMutation({ id: child.id })
	}

	return (
		<Card className='group relative cursor-pointer p-0 transition-colors hover:bg-muted/50'>
			<Link params={{ topicId: child.id.toString() }} to='/topics/{-$topicId}'>
				<CardContent className='min-h-48 px-3 py-2'>
					{child.name && (
						<h3 className='mb-1 font-semibold text-md'>{child.name}</h3>
					)}
					<div className='line-clamp-5 text-sm'>{child.notes}</div>
				</CardContent>
			</Link>
			<div className='absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100'>
				<DropdownMenu>
					<DropdownMenuTrigger asChild={true}>
						<Button
							className='h-6 w-6 p-0'
							onClick={e => e.preventDefault()}
							variant='ghost'
						>
							<MoreHorizontal className='h-3 w-3' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='center' side='bottom' sideOffset={2}>
						<DropdownMenuItem
							onClick={e => {
								e.preventDefault()
								handleRemoveRelationship()
							}}
						>
							<GitPullRequestClosed className='mr-2 h-4 w-4' />
							Remove as Child
						</DropdownMenuItem>
						<DropdownMenuItem
							className='text-red-600 focus:text-red-600'
							onClick={e => {
								e.preventDefault()
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
		</Card>
	)
}
