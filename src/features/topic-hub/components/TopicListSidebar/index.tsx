import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/Sidebar'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
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

	const {
		query,
		setQuery,
		results: filteredTopics
	} = useDebouncedSearch({
		topics: topics || []
	})

	const createTopic = useCallback(() => {
		insertTopicMutation([{}])
	}, [insertTopicMutation])

	return (
		<Sidebar>
			<SidebarHeader>
				<div className='flex items-center gap-2'>
					<div className='flex-1'>
						<Input
							onChange={e => setQuery(e.target.value)}
							placeholder='Search'
							type='search'
							value={query}
						/>
					</div>
					<Button onClick={createTopic} size='icon' variant='secondary'>
						<Plus className='h-4 w-4' />
					</Button>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<div className='space-y-0.5'>
					<TopicListBody isLoading={isLoading} topics={filteredTopics} />
				</div>
			</SidebarContent>
		</Sidebar>
	)
}
