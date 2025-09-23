import { TodaySection } from './TodaySection'
import { UpcomingSection } from './UpcomingSection'

export function TimelinePage() {
	return (
		<div className='container mx-auto p-6'>
			<TodaySection />
			<UpcomingSection />
		</div>
	)
}
