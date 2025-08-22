import { use } from 'react'
import { SelectedTopicContext } from '../stores/SelectedTopicContext'

export function Notes() {
	const { selectedTopic } = use(SelectedTopicContext)

	return (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex-1 space-y-4'>
				<div className='flex-1 rounded-lg border bg-muted/10 p-4'>
					<div className='text-sm'>{selectedTopic?.notes}</div>
				</div>
			</div>
		</div>
	)
}
