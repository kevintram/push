import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/Sidebar'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { TopicListBody } from './TopicListBody'

export function TopicListSidebar({
	topics,
	isLoading
}: {
	topics: Array<Topic> | undefined
	isLoading: boolean
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

	return (
		<Sidebar>
			<SidebarHeader>
				<div className='flex items-center justify-between'>
					<h2 className='font-semibold text-lg'>Topics</h2>
					<Button onClick={createTopic} size='icon' variant='ghost'>
						<Plus className='h-4 w-4' />
					</Button>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<div className='space-y-0.5'>
					<TopicListBody isLoading={isLoading} topics={topics || []} />
				</div>
			</SidebarContent>
		</Sidebar>
	)
}
