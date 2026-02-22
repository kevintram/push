import { Clock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { NoteCard } from '~/features/notes/components/NoteCard'
import type { Note } from '~/features/notes/types/note.types'
import { useSearchAll } from '~/features/search/api/searchAll'
import { useNoteNavigation } from '~/hooks/useNoteNavigation'
import { estimateCardSize } from '~/utils/estimateCardSize'

const RECENT_LIMIT = 50

type DateSection = {
	id: string
	label: string
	items: Array<Note>
}

function matchesFilter(note: Note, filter: EntityTypeFilterValue): boolean {
	if (filter === 'all') return true
	if (filter === 'none') return note.tags.length === 0
	if (filter === 'topic') return note.tags.includes('TOPIC')
	if (filter === 'source') return note.tags.includes('SOURCE')
	return note.tags.includes('PRACTICE')
}

function groupRecentByDate(notes: Array<Note>): Array<DateSection> {
	const now = new Date()
	now.setHours(0, 0, 0, 0)

	const byKey = new Map<string, DateSection>()
	for (const note of notes) {
		const date = new Date(note.updated_at)
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
		const existing = byKey.get(key)
		if (existing) {
			existing.items.push(note)
			continue
		}

		const normalized = new Date(date)
		normalized.setHours(0, 0, 0, 0)
		const diffDays = Math.floor(
			(now.getTime() - normalized.getTime()) / (1000 * 60 * 60 * 24)
		)
		const label =
			diffDays <= 0
				? 'Today'
				: diffDays === 1
					? 'Yesterday'
					: `${diffDays}d ago`
		byKey.set(key, { id: key, label, items: [note] })
	}

	return [...byKey.values()].sort((a, b) => (a.id < b.id ? 1 : -1))
}

export function RecentPage() {
	const navigateToNote = useNoteNavigation()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')

	const { data: searchResults = [], isLoading } = useSearchAll({
		limit: RECENT_LIMIT,
		entityTypes:
			activeFilter === 'all' || activeFilter === 'none'
				? undefined
				: activeFilter
	})

	const recentNotes = useMemo(
		() =>
			searchResults
				.map(result => result.note)
				.filter(note => matchesFilter(note, activeFilter)),
		[searchResults, activeFilter]
	)
	const sections = useMemo(() => groupRecentByDate(recentNotes), [recentNotes])

	return (
		<PageLayout>
			<PageLayout.Header icon={Clock} title='Recent'>
				<EntityTypeFilter
					activeFilter={activeFilter}
					onFilterChange={setActiveFilter}
				/>
			</PageLayout.Header>
			{isLoading ? (
				<PageLayout.Content className='max-w-screen p-6'>
					<LoadingSpinner containerClassName='min-h-64' />
				</PageLayout.Content>
			) : sections.length === 0 ? (
				<PageLayout.Content>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<Clock />
							</EmptyMedia>
							<EmptyTitle>No recent items</EmptyTitle>
							<EmptyDescription>
								See your most recently edited or reviewed notes
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</PageLayout.Content>
			) : (
				<PageLayout.Content className='max-w-screen space-y-6 p-6'>
					{sections.map(section => (
						<div className='space-y-3' key={section.id}>
							<h3 className='font-bold text-xl'>{section.label}</h3>
							<MasonryLayout
								estimateItemSize={(note, _index, laneWidth) =>
									estimateCardSize(
										note.title || 'Untitled note',
										note.body || '',
										laneWidth
									)
								}
								getItemKey={note => `note-${note.id}`}
								items={section.items}
								renderItem={note => (
									<NoteCard
										note={note}
										onClick={() => navigateToNote(note.id)}
									/>
								)}
							/>
						</div>
					))}
				</PageLayout.Content>
			)}
		</PageLayout>
	)
}
