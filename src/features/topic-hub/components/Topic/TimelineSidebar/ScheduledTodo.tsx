import {
	useRevalidateTables,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { useCallback, useMemo, useState } from 'react'
import { EditTodoForm } from '~/components/EditTodoForm'
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

export function ScheduledTodo({
	entry,
	index,
	nextDate
}: {
	entry: Tables<'todos_with_effective_date'>
	index: number
	nextDate?: Date | undefined // undefined if last entry
}) {
	const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false)

	const revalidateOtherTodoTables = useRevalidateTables([
		{ schema: 'public', table: 'todos' },
		{ schema: 'public', table: 'todos_today' }
	])

	const { mutateAsync: updateTodoMutation } = useUpdateMutation(
		supabase.from('todos_with_effective_date'),
		['id'],
		'*',
		{
			onSuccess: () => {
				revalidateOtherTodoTables()
			}
		}
	)

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			updateTodoMutation({
				id: entry.id,
				completed_at: checked ? new Date().toISOString() : null
			})
		},
		[entry.id, updateTodoMutation]
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
						<div className='flex flex-row items-stretch gap-3 py-1'>
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
							<div className='flex min-w-0 flex-1 items-stretch gap-3'>
								<p className='break-word min-w-0 flex-1 text-foreground text-xs [overflow-wrap:anywhere]'>
									{entry.description}
								</p>
								<div className='flex flex-col items-end gap-2 text-xs'>
									<Badge className='text-xs' variant='default'>
										{effectiveDate.toLocaleDateString()}
									</Badge>
									{nextDate && (
										<div className='mr-6 flex h-full'>
											<DaysElapsedMarker
												daysElapsed={numDaysElapsed(effectiveDate, nextDate)}
											/>
										</div>
									)}
								</div>
								<div className='flex items-start font-medium text-muted-foreground text-xs'>
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
					</CardContent>
				</Card>
			</PopoverTrigger>
			<PopoverContent
				align='start'
				className='w-80 p-6'
				side='right'
				sideOffset={10}
			>
				<EditTodoForm
					entry={entry}
					onClose={() => setIsEditPopoverOpen(false)}
				/>
			</PopoverContent>
		</Popover>
	)
}
