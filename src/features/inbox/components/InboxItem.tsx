import type { KeyboardEvent } from 'react'
import { useCallback } from 'react'
import { Card, CardContent } from '~/components/ui/Card'
import type { Tables } from '~/types/database.types'

interface InboxItemProps {
	onSelect: (topic: Tables<'topics'>) => void
	topic: Tables<'topics'>
}

export function InboxItem({ topic, onSelect }: InboxItemProps) {
	const createdAt = new Date(topic.inserted_at)

	const handleActivate = useCallback(() => {
		onSelect(topic)
	}, [onSelect, topic])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onSelect(topic)
			}
		},
		[onSelect, topic]
	)

	return (
		<Card
			className='group relative cursor-pointer p-0 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			role='button'
			tabIndex={0}
		>
			<CardContent className='flex flex-col gap-3 px-3 py-4'>
				<div className='space-y-2'>
					{topic.name && (
						<h3 className='font-semibold text-md leading-tight'>
							{topic.name}
						</h3>
					)}
					{topic.notes && (
						<p className='line-clamp-5 text-sm'>
							{topic.notes}
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
