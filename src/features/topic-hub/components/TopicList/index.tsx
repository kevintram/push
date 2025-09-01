import {
	useInsertMutation,
	useQuery
} from '@supabase-cache-helpers/postgrest-react-query'
import { Link } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { SelectedTopicIdContext } from '../../stores/SelectedTopicIdContext'
import { parseSupabaseTopic } from '../../utils/parseSupabaseTopic'
import { TopicListHeader } from './TopicListHeader'
import { TopicListItem } from './TopicListItem'
import { TopicListSkeleton } from './TopicListSkeleton'

export function TopicList({
	selectedTopicId
}: {
	selectedTopicId: number | undefined
}) {
	const { data, isLoading } = useQuery<Array<Tables<'topics'>>>(
		supabase
			.from('topics')
			.select('*')
			.order('inserted_at', { ascending: false })
	)

	const topics: Array<Topic> = data?.map(parseSupabaseTopic) ?? []

	const { mutateAsync: insertTopicMutation } = useInsertMutation(
		supabase.from('topics'),
		['id'],
		'*',
		{
			onSuccess: data => {
				// select newly inserted topic
				// TODO: fix this
				// if (data?.[0]) {
				// 	setSelectedTopic(parseSupabaseTopic(data[0]))
				// }
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
					<SelectedTopicIdContext value={{ selectedTopicId }}>
						{topics.map(topic => (
							<Link
								key={topic.id}
								params={{ topicId: topic.id.toString() }}
								to='/topics/{-$topicId}'
							>
								<TopicListItem topic={topic} />
							</Link>
						))}
					</SelectedTopicIdContext>
				</div>
			</div>
		</div>
	)
}
