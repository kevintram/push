import { Inbox } from 'lucide-react'
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

export function InboxPage() {
	const navigateToNote = useNoteNavigation()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

	const { data: notes = [], isLoading } = useNotes({
		inboxed: true,
		archived: false,
		order: 'desc'
	})

	const inboxNotes = useMemo(
		() => notes.filter(note => matchesFilter(note, activeFilter)),
		[notes, activeFilter]
	)

	const inboxCountLabel = isLoading ? '...' : inboxNotes.length

	return (
		<PageLayout>
			<PageLayout.Header
				icon={Inbox}
				title='Inbox'
				titleExtra={
					<span className='font-semibold text-muted-foreground text-xl'>
						{inboxCountLabel}
					</span>
				}
			>
				<EntityTypeFilter
					activeFilter={activeFilter}
					onFilterChange={setActiveFilter}
				/>
			</PageLayout.Header>

			{isLoading ? (
				<PageLayout.Content className='max-w-screen p-6'>
					<MasonryLayoutSkeleton />
				</PageLayout.Content>
			) : inboxNotes.length === 0 ? (
				<PageLayout.Content>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<Inbox />
							</EmptyMedia>
							<EmptyTitle>Your inbox is empty</EmptyTitle>
							<EmptyDescription>
								The inbox is for items to be processed later: fleeting notes,
								random ideas, whatever
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<EmptyStateCreateTopicButton
								buttonText='Add to your inbox'
								onClick={() => setIsAddDialogOpen(true)}
							/>
						</EmptyContent>
					</Empty>
				</PageLayout.Content>
			) : (
				<PageLayout.Content className='max-w-screen p-6'>
					<MasonryLayout
						estimateItemSize={(note, _index, laneWidth) =>
							estimateCardSize(
								note.title || 'Untitled note',
								note.body || '',
								laneWidth
							)
						}
						getItemKey={note => `note-${note.id}`}
						items={inboxNotes}
						renderItem={note => (
							<NoteCard note={note} onClick={() => navigateToNote(note.id)} />
						)}
					/>
				</PageLayout.Content>
			)}
			<AddNoteDialog
				defaults={{ inboxed: true, archived: false, tags: ['TOPIC'] }}
				onOpenChange={setIsAddDialogOpen}
				open={isAddDialogOpen}
			/>
		</PageLayout>
	)
}
