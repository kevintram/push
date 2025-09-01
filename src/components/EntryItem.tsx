import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { Link } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { Checkbox } from '~/components/ui/Checkbox'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

type TimelineEntry = Tables<'timeline_entries'> & { topics: { name: string } }

interface EntryItemProps {
	entry: TimelineEntry
	isCompleted?: boolean
}

export function EntryItem({ entry, isCompleted = false }: EntryItemProps) {
	const dateValue = isCompleted ? entry.completed_at! : entry.scheduled_at
	const dateLabel = new Date(dateValue).toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	})

	const isOverdue = !isCompleted && new Date(entry.scheduled_at) < new Date()
	const [isChecked, setIsChecked] = useState(isCompleted)

	const { mutateAsync: updateTimelineEntryMutation } = useUpdateMutation(
		supabase.from('timeline_entries'),
		['id'],
		'*'
	)

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			setIsChecked(checked)
			updateTimelineEntryMutation({
				id: entry.id,
				completed_at: checked ? new Date().toISOString() : null
			})
		},
		[entry.id, updateTimelineEntryMutation]
	)

	return (
		<Link
			params={{ topicId: entry.topic_id.toString() }}
			to='/topics/{-$topicId}'
		>
			<div className='flex items-start gap-4 rounded-lg p-4 transition-colors hover:bg-muted/50'>
				<Checkbox
					checked={isChecked}
					className={`mt-1 ${isOverdue ? 'border-red-500 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500' : ''}`}
					onCheckedChange={handleCheckboxChange}
				/>
				<div className='min-w-0 flex-1'>
					<p className='mb-1 text-base leading-relaxed'>{entry.description}</p>
					<p className='text-muted-foreground text-sm'>{entry.topics.name}</p>
				</div>
				<div className='whitespace-nowrap text-muted-foreground text-sm'>
					{dateLabel}
				</div>
			</div>
		</Link>
	)
}
