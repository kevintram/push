import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { SelectedTopicIdContext } from '../../stores/SelectedTopicIdContext'
import { TopicListHeader } from './TopicListHeader'
import { TopicListItem } from './TopicListItem'
import { TopicListSkeleton } from './TopicListSkeleton'

export function TopicList({
	topics,
	isLoading,
	selectedTopic
}: {
	topics: Array<Topic> | undefined
	isLoading: boolean
	selectedTopic: Topic | undefined
}) {
	const navigate = useNavigate()

	const { mutateAsync: insertTopicMutation } = useInsertMutation(
		supabase.from('topics'),
		['id'],
		'*',
		{
			onSuccess: data => {
				if (data?.[0]) {
					navigate({
						to: '/topics/{-$topicId}',
						params: { topicId: data[0].id.toString() }
					})
				}
			}
		}
	)

	const createTopic = useCallback(() => {
		insertTopicMutation([{}])
	}, [insertTopicMutation])

	if (isLoading) {
		return <TopicListSkeleton />
	}

	if (!topics || topics?.length === 0) {
		return (
			<div className='flex h-full flex-col gap-4 p-4'>
				<TopicListHeader onCreateTopic={createTopic} />

				<div className='flex flex-1 items-center justify-center'>
					<div className='text-center text-muted-foreground'>
						<p>No topics found</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='flex h-full flex-col gap-4 p-4'>
			<TopicListHeader onCreateTopic={createTopic} />

			<div className='flex-1 overflow-auto'>
				<div className='space-y-1'>
					<SelectedTopicIdContext
						value={{ selectedTopicId: selectedTopic?.id }}
					>
						{topics.map(topic => (
							<TopicListItem key={topic.id} topic={topic} />
						))}
					</SelectedTopicIdContext>
				</div>
			</div>
		</div>
	)
}
