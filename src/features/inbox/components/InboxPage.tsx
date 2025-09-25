import { useInboxTopics } from '../api'
import { CreateInboxTopic } from './CreateInboxTopic'
import { InboxList } from './InboxList'

export function InboxPage() {
	const { data: inboxTopics, isLoading } = useInboxTopics()

	return (
		<div className='container mx-auto'>
			<div className='sticky top-0 z-10 bg-background/95 p-6 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
				<div className='flex items-center justify-between'>
					<h1 className='font-bold text-3xl'>Inbox</h1>
					<CreateInboxTopic />
				</div>
			</div>
			<div className='px-6 pb-6'>
				<InboxList isLoading={isLoading} topics={inboxTopics} />
			</div>
		</div>
	)
}
