import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { parseSupabaseTopic } from '../../utils/parseSupabaseTopic'
import { TopicHeader } from './Header'
import { PracticeAndNotes } from './PracticeAndNotes'
import { Timeline } from './Timeline'
import { TopicFamilyPanel } from './TopicFamilyPanel'
import { TopicPageSkeleton } from './TopicPageSkeleton'

export function TopicPage({ topicId }: { topicId: number }) {
	const { data, isLoading } = useQuery(
		supabase.from('topics').select('*').eq('id', topicId).single()
	)

	if (isLoading) {
		return <TopicPageSkeleton />
	}

	if (!data) {
		return (
			<div className='flex w-full flex-1 flex-col gap-4 overflow-auto p-3 sm:gap-6 sm:p-4 md:p-6'>
				<div className='text-center text-muted-foreground'>Topic not found</div>
			</div>
		)
	}

	const topic: Topic = parseSupabaseTopic(data)

	return (
		<div className='flex h-full flex-1 flex-row'>
			<div className='flex w-full flex-col gap-4 sm:gap-6 sm:p-4 md:p-6'>
				<TopicHeader
					createdAt={topic.inserted_at}
					id={topic.id}
					key={topic.id}
					name={topic.name}
					retrievability={topic.retrievability}
					stability={topic.stability}
				/>

				<TopicFamilyPanel topic={topic} />

				<PracticeAndNotes />
			</div>

			<div className='flex'>
				<Timeline />
			</div>

				
		</div>
	)
}
