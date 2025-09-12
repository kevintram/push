import { TopicFamilyPanel } from './FamilyPanel'
import { TopicHeader } from './Header'
import { PracticeAndNotes } from './PracticeAndNotes'
import { TopicPageSkeleton } from './TopicPageSkeleton'

export function TopicPage({ isLoading }: { isLoading: boolean }) {
	if (isLoading) {
		return <TopicPageSkeleton />
	}

	return (
		<div className='!pt-0 flex flex-1 flex-col items-center gap-4 sm:gap-6 sm:p-4 md:p-6'>
			<TopicHeader />

			<TopicFamilyPanel />

			<PracticeAndNotes />
		</div>
	)
}
