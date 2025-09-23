import { Archive } from 'lucide-react'
import { useState } from 'react'
import { EntryItem } from '~/components/EntryItem'
import { Badge } from '~/components/ui/Badge'
import { useTodoEntries } from '../api'
import { EmptyState } from './EmptyState'

export function TodosPage() {
	const [showArchived, setShowArchived] = useState(false)
	const { overdue, today, tomorrow, nextSevenDays, future, unscheduled } =
		useTodoEntries(showArchived)

	const hasAnyEntries =
		(overdue && overdue.length > 0) ||
		(today && today.length > 0) ||
		(tomorrow && tomorrow.length > 0) ||
		(nextSevenDays && nextSevenDays.length > 0) ||
		(future && future.length > 0) ||
		(unscheduled && unscheduled.length > 0)

	return (
		<div className='container mx-auto'>
			<div className='sticky top-0 z-10 bg-background/95 p-6 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
				<div className='flex items-center justify-between'>
					<Badge
						className='cursor-pointer'
						onClick={() => setShowArchived(!showArchived)}
						variant={showArchived ? 'default' : 'outline'}
					>
						<Archive className='h-4 w-4' />
						Archived
					</Badge>
				</div>
			</div>
			<div className='px-6 pb-6'>
				{overdue && overdue.length > 0 && (
					<div className='mb-8'>
						<div className='mb-2'>
							<h1 className='font-bold text-3xl text-red-600'>Overdue</h1>
						</div>

						<div className='space-y-0.5'>
							{overdue.map(entry => (
								<EntryItem
									entry={entry}
									isCompleted={entry.completed_at !== null}
									key={entry.id}
								/>
							))}
						</div>
					</div>
				)}

				{today && today.length > 0 && (
					<div className='mb-8'>
						<div className='mb-2'>
							<h1 className='font-bold text-3xl'>Today</h1>
						</div>

						<div className='space-y-0.5'>
							{today.map(entry => (
								<EntryItem
									entry={entry}
									isCompleted={entry.completed_at !== null}
									key={entry.id}
								/>
							))}
						</div>
					</div>
				)}

				{tomorrow && tomorrow.length > 0 && (
					<div className='mb-8'>
						<div className='mb-2'>
							<h2 className='font-bold text-3xl'>Tomorrow</h2>
						</div>

						<div className='space-y-0.5'>
							{tomorrow.map(entry => (
								<EntryItem
									entry={entry}
									isCompleted={entry.completed_at !== null}
									key={entry.id}
								/>
							))}
						</div>
					</div>
				)}

				{nextSevenDays && nextSevenDays.length > 0 && (
					<div className='mb-8'>
						<div className='mb-2'>
							<h2 className='font-bold text-3xl'>Next 7 Days</h2>
						</div>

						<div className='space-y-0.5'>
							{nextSevenDays.map(entry => (
								<EntryItem
									entry={entry}
									isCompleted={entry.completed_at !== null}
									key={entry.id}
								/>
							))}
						</div>
					</div>
				)}

				{future && future.length > 0 && (
					<div className='mb-8'>
						<div className='mb-2'>
							<h2 className='font-bold text-3xl'>In the Future</h2>
						</div>

						<div className='space-y-0.5'>
							{future.map(entry => (
								<EntryItem entry={entry} isCompleted={false} key={entry.id} />
							))}
						</div>
					</div>
				)}

				{unscheduled && unscheduled.length > 0 && (
					<div>
						<div className='mb-2'>
							<h2 className='font-bold text-3xl text-gray-600'>Unscheduled</h2>
						</div>

						<div className='space-y-0.5'>
							{unscheduled.map(entry => (
								<EntryItem entry={entry} isCompleted={false} key={entry.id} />
							))}
						</div>
					</div>
				)}

				{!hasAnyEntries && (
					<EmptyState
						message={
							showArchived
								? 'No archived entries found.'
								: 'No entries found. Get gulping!'
						}
					/>
				)}
			</div>
		</div>
	)
}
