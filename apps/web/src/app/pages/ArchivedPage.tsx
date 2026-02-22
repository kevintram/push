import { Archive } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { useNotes } from '~/features/notes/api/getNotes'
import { NoteCard } from '~/features/notes/components/NoteCard'
import type { Note } from '~/features/notes/types/note.types'
import { useNoteNavigation } from '~/hooks/useNoteNavigation'
import { estimateCardSize } from '~/utils/estimateCardSize'

function matchesFilter(note: Note, filter: EntityTypeFilterValue): boolean {
	if (filter === 'all') return true
	if (filter === 'none') return note.tags.length === 0
	if (filter === 'topic') return note.tags.includes('TOPIC')
	if (filter === 'source') return note.tags.includes('SOURCE')
	return note.tags.includes('PRACTICE')
}

export function ArchivedPage() {
	const navigateToNote = useNoteNavigation()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')

	const { data: notes = [], isLoading } = useNotes({
		archived: true,
		order: 'desc'
	})

	const archivedNotes = useMemo(
		() => notes.filter(note => matchesFilter(note, activeFilter)),
		[notes, activeFilter]
	)

	if (isLoading) {
		return (
			<PageLayout>
				<PageLayout.Header icon={Archive} title='Archived'>
					<EntityTypeFilter
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
					/>
				</PageLayout.Header>
				<PageLayout.Content className='max-w-screen p-6'>
					<MasonryLayoutSkeleton />
				</PageLayout.Content>
			</PageLayout>
		)
	}

	if (archivedNotes.length === 0) {
		return (
			<PageLayout>
				<PageLayout.Header icon={Archive} title='Archived'>
					<EntityTypeFilter
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
					/>
				</PageLayout.Header>
				<PageLayout.Content>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<Archive />
							</EmptyMedia>
							<EmptyTitle>No archived items</EmptyTitle>
							<EmptyDescription>
								Archive items you want to hide but keep around just in case
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</PageLayout.Content>
			</PageLayout>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={Archive} title='Archived'>
				<EntityTypeFilter
					activeFilter={activeFilter}
					onFilterChange={setActiveFilter}
				/>
			</PageLayout.Header>
			<PageLayout.Content className='max-w-screen p-6'>
				<MasonryLayout
					estimateItemSize={(note, _index, laneWidth) =>
						estimateCardSize(
							note.title || 'Untitled note',
							note.body || '',
							laneWidth
						)
					}
					gap={16}
					getItemKey={note => `note-${note.id}`}
					items={archivedNotes}
					renderItem={note => (
						<NoteCard note={note} onClick={() => navigateToNote(note.id)} />
					)}
				/>
			</PageLayout.Content>
		</PageLayout>
	)
}
