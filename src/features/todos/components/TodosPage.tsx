import { EntryItem } from '~/components/EntryItem'
import { useTodoEntries } from '../api'
import { EmptyState } from './EmptyState'

export function TodosPage() {
	const { overdue, today, tomorrow, nextSevenDays, future, unscheduled } =
		useTodoEntries()

	const hasAnyEntries =
		(overdue && overdue.length > 0) ||
		(today && today.length > 0) ||
		(tomorrow && tomorrow.length > 0) ||
		(nextSevenDays && nextSevenDays.length > 0) ||
		(future && future.length > 0) ||
		(unscheduled && unscheduled.length > 0)

	return (
		<div className='container mx-auto p-6'>
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
							<EntryItem
								entry={entry}
								isCompleted={false}
								key={entry.id}
							/>
						))}
					</div>
				</div>
			)}

			{!hasAnyEntries && (
				<EmptyState message='No entries found. Get gulping!' />
			)}
		</div>
	)
}
