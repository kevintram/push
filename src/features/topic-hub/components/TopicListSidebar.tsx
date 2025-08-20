import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { Plus, Search } from 'lucide-react'
import { use, useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { SelectedTopicContext } from '../stores/SelectedTopicContext'
import { parseSupabaseTopic } from '../utils/parseSupabaseTopic'
import { TopicListItem } from './TopicListItem'

export function TopicListSidebar({ topics }: { topics: Array<Topic> }) {
	const { setSelectedTopic } = use(SelectedTopicContext)

	const { mutateAsync: insertTopicMutation } = useInsertMutation(
		supabase.from('topics'),
		['id'],
		'*',
		{
			onSuccess: data => {
				// select newly inserted topic
				if (data?.[0]) {
					setSelectedTopic(parseSupabaseTopic(data[0]))
				}
			}
		}
	)

	const createTopic = useCallback(() => {
		insertTopicMutation([{}])
	}, [insertTopicMutation])

	return (
		<div className='flex h-full flex-col gap-4 p-4'>
			<div className='flex items-center gap-2'>
				<div className='relative flex-1'>
					<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
					<Input className='pl-9' placeholder='Search topics...' />
				</div>
				<Button onClick={() => createTopic()} size='icon' variant='secondary'>
					<Plus className='h-4 w-4' />
				</Button>
			</div>

			<div className='flex-1 overflow-auto'>
				<div className='space-y-1'>
					{topics.map(topic => (
						<TopicListItem key={topic.id} topic={topic} />
					))}
				</div>
			</div>
		</div>
	)
}
