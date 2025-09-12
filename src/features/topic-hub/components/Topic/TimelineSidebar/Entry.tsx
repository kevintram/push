import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { useCallback, useMemo, useState } from 'react'
import { EditEntryForm } from '~/components/EditEntryForm'
import { Badge } from '~/components/ui/Badge'
import { Card, CardContent } from '~/components/ui/Card'
import { Checkbox } from '~/components/ui/Checkbox'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { dateOf } from '../../../../../utils/dateOf'
import { numDaysElapsed } from '../../../utils/daysElapsed'
import { isOverdue } from '../../../utils/isOverdue'
import { DaysElapsedMarker } from './DaysElapsedMarker'

export function Entry({
	entry,
	index,
	nextDate
}: {
	entry: Tables<'timeline_entries_with_effective_date'>
	index: number
	nextDate?: Date | undefined // undefined if last entry
}) {
	// TODO: Implement count based on timeline_entry_practice_cards
	// const reviewedItemsCount = 0

	// TODO: Implement stability change and retrievability with SRS logic
	// const stabilityChange = currEntry.stability_change
	// const retrievability = currEntry.retrievability

	const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false)

	const { mutateAsync: updateTimelineEntryMutation } = useUpdateMutation(
		supabase.from('timeline_entries_with_effective_date'),
		['id'],
		'*'
	)

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			updateTimelineEntryMutation({
				id: entry.id,
				completed_at: checked ? new Date().toISOString() : null
			})
		},
		[entry.id, updateTimelineEntryMutation]
	)

	const effectiveDate: Date = useMemo(() => {
		return dateOf(entry.effective_date)!
	}, [entry.effective_date])

	const isOverdueValue: boolean = useMemo(() => {
		return isOverdue({
			scheduledDate: entry.scheduled_at,
			isCompleted: entry.completed_at !== null
		})
	}, [entry.scheduled_at, entry.completed_at])

	return (
		<Popover onOpenChange={setIsEditPopoverOpen} open={isEditPopoverOpen}>
			<PopoverTrigger asChild={true}>
				<Card className='cursor-pointer rounded border-none bg-transparent px-2 py-1 shadow-none transition-colors hover:bg-muted/50'>
					<CardContent className='p-0'>
						<div className='flex flex-row gap-3'>
							<div className='flex flex-col items-start'>
								<div className='flex items-center gap-2'>
									<Checkbox
										checked={!!entry.completed_at}
										className={
											isOverdueValue
												? 'border-red-600 dark:border-red-700 dark:bg-red-700'
												: ''
										}
										onCheckedChange={handleCheckboxChange}
										onClick={e => e.stopPropagation()}
									/>

									<Badge variant='default'>
										{effectiveDate.toLocaleDateString()}
									</Badge>
								</div>

								<div className='ml-10'>
									{nextDate && (
										<DaysElapsedMarker
											daysElapsed={numDaysElapsed(effectiveDate, nextDate)}
										/>
									)}
								</div>
							</div>

							<div className='flex flex-1 flex-row items-start gap-2 py-1'>
								<div className='flex-1 text-foreground text-xs'>
									{entry.description}
								</div>
								<div className='flex items-start gap-1'>
									<div className='font-medium text-muted-foreground text-xs'>
										{index + 1}
									</div>
								</div>
							</div>

							{/* TODO: Implement practice cards, stability change, and retrievability later*/}
							{/* <div className='flex-1 pb-6'>
								<div className='mb-3'>
									<div className='mb-2 flex items-center gap-2'>
										<Progress className='flex-1' value={currEntry.stability} />
										<span className='font-medium text-muted-foreground text-xs'>
											{currEntry.stability} days
										</span>
									</div>

									<div className='flex items-center gap-2'>
										<div className='flex items-center gap-1 text-muted-foreground text-xs'>
											<ArchiveRestore className='h-3 w-3' />
											<span>{(retrievability * 100).toFixed(0)}%</span>
										</div>
									</div>
								</div>

								<div className='space-y-2'>
									<div className='text-foreground text-xs'>
										{reviewedItemsCount} card{reviewedItemsCount !== 1 ? 's' : ''}{' '}
										reviewed
									</div>

									<div className='flex items-center justify-between'>
										{stabilityChange !== 0 && (
											<div
												className={`font-medium text-xs ${
													stabilityChange > 0 ? 'text-green-600' : 'text-red-600'
												}`}
											>
												{stabilityChange > 0 ? '+' : ''}
												{stabilityChange}d stability
											</div>
										)}
									</div>
								</div>
							</div> */}
						</div>
					</CardContent>
				</Card>
			</PopoverTrigger>
			<PopoverContent
				align='start'
				className='w-80 p-6'
				side='right'
				sideOffset={10}
			>
				<EditEntryForm
					entry={entry}
					onClose={() => setIsEditPopoverOpen(false)}
				/>
			</PopoverContent>
		</Popover>
	)
}
