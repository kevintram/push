import {
	useRevalidateTables,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { Link } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { EditEntryForm } from '~/components/EditEntryForm'
import { Checkbox } from '~/components/ui/Checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { isOverdue } from '~/features/topic-hub/utils/isOverdue'
import type { Tables } from '~/types/database.types'
import { dateOf } from '~/utils/dateOf'
import { supabase } from '~/utils/supabase'

// TODO: clean up this mess when migrate to hono API
type TimelineEntry = (
	| Tables<'timeline_entries'>
	| Tables<'timeline_entries_with_effective_date'>
) & { topics: { name: string } | null }

interface EntryItemProps {
	entry: TimelineEntry
	isCompleted?: boolean
}

export function EntryItem({ entry, isCompleted = false }: EntryItemProps) {
	const revalidateTables = useRevalidateTables([
		{ schema: 'public', table: 'timeline_entries' },
		{ schema: 'public', table: 'timeline_entries_today' },
		{ schema: 'public', table: 'timeline_entries_with_effective_date' }
	])

	const dateValue = isCompleted ? entry.completed_at : entry.scheduled_at
	const dateLabel = dateOf(dateValue)?.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	})

	const isOverdueValue = useMemo(
		() =>
			isOverdue({
				scheduledDate: entry.scheduled_at,
				isCompleted
			}),
		[isCompleted, entry.scheduled_at]
	)

	const [isChecked, setIsChecked] = useState(isCompleted)
	const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false)

	const { mutateAsync: updateTimelineEntryMutation } = useUpdateMutation(
		supabase.from('timeline_entries'),
		['id'],
		'*, topics(name)',
		{
			onSuccess: () => {
				revalidateTables()
			}
		}
	)

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			setIsChecked(checked)
			updateTimelineEntryMutation({
				id: entry.id ?? undefined,
				completed_at: checked ? new Date().toISOString() : null
			})
		},
		[entry.id, updateTimelineEntryMutation]
	)

	return (
		<DropdownMenu
			onOpenChange={setIsEditDropdownOpen}
			open={isEditDropdownOpen}
		>
			<DropdownMenuTrigger asChild={true}>
				<div className='flex cursor-pointer items-start gap-4 rounded-lg p-4 transition-colors hover:bg-muted/50'>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper div to prevent event propagation to parent Link */}
					{/* biome-ignore lint/nursery/noNoninteractiveElementInteractions: wrapper div to prevent event propagation to parent Link */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper div only prevents propagation, keyboard interaction handled by child Checkbox */}
					<div
						onClick={e => {
							e.preventDefault()
							e.stopPropagation()
						}}
						onMouseDown={e => {
							e.preventDefault()
							e.stopPropagation()
						}}
						onPointerDown={e => {
							e.preventDefault()
							e.stopPropagation()
						}}
					>
						<Checkbox
							checked={isChecked}
							className={`mt-1 ${isOverdueValue ? 'border-red-500 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500' : ''}`}
							onCheckedChange={handleCheckboxChange}
						/>
					</div>
					<div className='min-w-0 flex-1'>
						{entry.description && (
							<p className='break-word mb-1 text-base leading-relaxed [overflow-wrap:anywhere]'>
								{entry.description}
							</p>
						)}
						{entry.topics?.name && (
							<p className='break-word text-muted-foreground text-sm [overflow-wrap:anywhere]'>
								{entry.topics.name}
							</p>
						)}
					</div>
					<div className='whitespace-nowrap text-muted-foreground text-sm'>
						{dateLabel}
					</div>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align='start'
				className='w-80 p-4'
				side='bottom'
				sideOffset={5}
			>
				<div className='flex w-full flex-col items-center gap-4'>
					{entry.topics?.name && (
						<Link
							className='flex w-full flex-row'
							params={{ topicId: entry.topic_id?.toString() ?? '' }}
							to='/topics/{-$topicId}'
						>
							<span className='text-center font-semibold text-lg hover:underline'>
								{entry.topics.name}
							</span>
						</Link>
					)}
					<EditEntryForm
						entry={entry}
						onClose={() => setIsEditDropdownOpen(false)}
					/>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
