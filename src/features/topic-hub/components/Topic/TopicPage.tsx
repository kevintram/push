import type { Topic } from '~/types/topics.types'
import { TopicHeader } from './Header'
import { PracticeAndNotes } from './PracticeAndNotes'
import { Timeline } from './Timeline'
import { TopicFamilyPanel } from './TopicFamilyPanel'
import { TopicPageSkeleton } from './TopicPageSkeleton'

export function TopicPage({
	topic,
	isLoading
}: {
	topic: Topic | undefined
	isLoading: boolean
}) {
	if (isLoading) {
		return <TopicPageSkeleton />
	}

	if (!topic) {
		return (
			<div className='flex w-full flex-1 flex-col gap-4 overflow-auto p-3 sm:gap-6 sm:p-4 md:p-6'>
				<div className='text-center text-muted-foreground'>Topic not found</div>
			</div>
		)
	}

	return (
		<div>
			<div className='flex w-full flex-1 flex-col gap-4 overflow-auto p-3 sm:gap-6 sm:p-4 md:p-6'>
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

				<Timeline />
			</div>
		</div>
	)
}
