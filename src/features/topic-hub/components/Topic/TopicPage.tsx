import { use } from 'react'
import { SelectedTopicContext } from '../../stores/SelectedTopicContext'
import { TopicHeader } from './Header'
import { PracticeAndNotes } from './PracticeAndNotes'
import { Timeline } from './Timeline'
import { TopicFamilyPanel } from './TopicFamilyPanel'
import { TopicPageSkeleton } from './TopicPageSkeleton'

export function TopicPage({ isLoading }: { isLoading: boolean }) {
	const { selectedTopic } = use(SelectedTopicContext)

	if (isLoading) {
		return <TopicPageSkeleton />
	}

	if (!selectedTopic) {
		return (
			<div className='flex w-full flex-1 flex-col gap-4 overflow-auto p-3 sm:gap-6 sm:p-4 md:p-6'>
				<div className='text-center text-muted-foreground'>Topic not found</div>
			</div>
		)
	}

	return (
		<div className='flex h-full flex-1 flex-row'>
			<div className='flex w-full flex-col gap-4 sm:gap-6 sm:p-4 md:p-6'>
				<TopicHeader />

				<TopicFamilyPanel />

				<PracticeAndNotes />
			</div>

			<div className='flex'>
				<Timeline />
			</div>
		</div>
	)
}
