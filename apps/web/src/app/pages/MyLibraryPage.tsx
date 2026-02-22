import { Library } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { useNotes } from '~/features/notes/api/getNotes'
import { AddNoteDialog } from '~/features/notes/components/AddNoteDialog'
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

export function MyLibraryPage() {
	const navigateToNote = useNoteNavigation()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

	const { data: notes = [], isLoading } = useNotes({
		root: true,
		archived: false,
		inboxed: false,
		order: 'desc'
	})

	const libraryItems = useMemo(
		() => notes.filter(note => matchesFilter(note, activeFilter)),
		[notes, activeFilter]
	)

	if (isLoading) {
		return (
			<PageLayout>
				<PageLayout.Header icon={Library} title='My Library'>
					<EntityTypeFilter
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
					/>
				</PageLayout.Header>
				<PageLayout.Content className='max-w-screen p-6'>
					<MasonryLayoutSkeleton />
				</PageLayout.Content>
				<AddNoteDialog
					defaults={{ inboxed: false, archived: false, tags: ['TOPIC'] }}
					onOpenChange={setIsAddDialogOpen}
					open={isAddDialogOpen}
				/>
			</PageLayout>
		)
	}

	if (libraryItems.length === 0) {
		return (
			<PageLayout>
				<PageLayout.Header icon={Library} title='My Library'>
					<EntityTypeFilter
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
					/>
				</PageLayout.Header>
				<PageLayout.Content>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<Library />
							</EmptyMedia>
							<EmptyTitle>A place for all your learning</EmptyTitle>
							<EmptyDescription>Create a note to get started</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<EmptyStateCreateTopicButton
								buttonText='Create new note'
								onClick={() => setIsAddDialogOpen(true)}
								showHoverCard={false}
							/>
						</EmptyContent>
					</Empty>
				</PageLayout.Content>
				<AddNoteDialog
					defaults={{ inboxed: false, archived: false, tags: ['TOPIC'] }}
					onOpenChange={setIsAddDialogOpen}
					open={isAddDialogOpen}
				/>
			</PageLayout>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={Library} title='My Library'>
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
					items={libraryItems}
					renderItem={note => (
						<NoteCard note={note} onClick={() => navigateToNote(note.id)} />
					)}
				/>
			</PageLayout.Content>
			<AddNoteDialog
				defaults={{ inboxed: false, archived: false, tags: ['TOPIC'] }}
				onOpenChange={setIsAddDialogOpen}
				open={isAddDialogOpen}
			/>
		</PageLayout>
	)
}
