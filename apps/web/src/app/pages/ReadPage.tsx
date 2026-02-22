import { BookOpen } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useNotes } from '~/features/notes/api/getNotes'
import { NoteCard } from '~/features/notes/components/NoteCard'
import type { Note, ReadingStatus } from '~/features/notes/types/note.types'
import { useNoteNavigation } from '~/hooks/useNoteNavigation'
import { estimateCardSize } from '~/utils/estimateCardSize'

type ReadTab = 'read' | 'on-hold' | 'finished'

type ReadSection = {
	id: string
	label: string
	items: Array<Note>
}

const READ_TAB_OPTIONS: Array<{ value: ReadTab; label: string }> = [
	{ value: 'read', label: 'Read' },
	{ value: 'on-hold', label: 'On Hold' },
	{ value: 'finished', label: 'Finished' }
]

function isReadTab(value: string): value is ReadTab {
	return READ_TAB_OPTIONS.some(option => option.value === value)
}

function bucketNotesByStatus(notes: Array<Note>) {
	const buckets: Record<ReadingStatus, Array<Note>> = {
		NEW: [],
		IN_PROGRESS: [],
		ON_HOLD: [],
		FINISHED: []
	}

	for (const note of notes) {
		buckets[note.reading_status].push(note)
	}

	return buckets
}

function getEmptyStateCopy(activeTab: ReadTab) {
	switch (activeTab) {
		case 'read':
			return {
				title: 'No notes to read',
				description: 'Add a note to your reading list to show it here'
			}
		case 'on-hold':
			return {
				title: 'No notes on hold',
				description: 'Notes marked On Hold will show up here'
			}
		case 'finished':
			return {
				title: 'No finished notes',
				description: 'Notes marked Finished will show up here'
			}
		default:
			return {
				title: 'No notes',
				description: 'Notes will show up here once available'
			}
	}
}

function estimateNoteSize(
	note: Note,
	_index: number,
	laneWidth: number
): number {
	return estimateCardSize(note.title || 'Untitled', note.body || '', laneWidth)
}

function getNoteKey(note: Note): string {
	return `note-${note.id}`
}

function matchesNoteFilter(note: Note, filter: EntityTypeFilterValue): boolean {
	if (filter === 'all') return true
	if (filter === 'none') return note.tags.length === 0
	if (filter === 'topic') return note.tags.includes('TOPIC')
	if (filter === 'source') return note.tags.includes('SOURCE')
	return note.tags.includes('PRACTICE')
}

export function ReadPage() {
	const [activeTab, setActiveTab] = useState<ReadTab>('read')
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')
	const navigateToNote = useNoteNavigation()

	const { data: notes = [], isLoading } = useNotes({
		in_reading_list: true,
		archived: false,
		order: 'desc'
	})

	const filteredNotes = useMemo(
		() => notes.filter(note => matchesNoteFilter(note, activeFilter)),
		[notes, activeFilter]
	)

	const statusBuckets = useMemo(() => {
		const sortedNotes = [...filteredNotes].sort(
			(a, b) =>
				new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
		)
		return bucketNotesByStatus(sortedNotes)
	}, [filteredNotes])

	const tabCounts = useMemo(
		() => ({
			read: statusBuckets.IN_PROGRESS.length + statusBuckets.NEW.length,
			'on-hold': statusBuckets.ON_HOLD.length,
			finished: statusBuckets.FINISHED.length
		}),
		[statusBuckets]
	)

	const sections = useMemo<Array<ReadSection>>(() => {
		if (activeTab === 'read') {
			return [
				{
					id: 'in-progress',
					label: 'In Progress',
					items: statusBuckets.IN_PROGRESS
				},
				{
					id: 'new',
					label: 'New',
					items: statusBuckets.NEW
				}
			].filter(section => section.items.length > 0)
		}

		if (activeTab === 'on-hold') {
			return [
				{
					id: 'on-hold',
					label: 'On Hold',
					items: statusBuckets.ON_HOLD
				}
			]
		}

		return [
			{
				id: 'finished',
				label: 'Finished',
				items: statusBuckets.FINISHED
			}
		]
	}, [activeTab, statusBuckets])

	const visibleSections = useMemo(
		() => sections.filter(section => section.items.length > 0),
		[sections]
	)

	const emptyStateCopy = useMemo(
		() => getEmptyStateCopy(activeTab),
		[activeTab]
	)

	const renderItem = useCallback(
		(note: Note) => (
			<NoteCard
				minHeight={96}
				note={note}
				onClick={() => navigateToNote(note.id)}
			/>
		),
		[navigateToNote]
	)

	return (
		<PageLayout>
			<PageLayout.Header icon={BookOpen} title='Read'>
				<Tabs
					className='-mb-2'
					onValueChange={value => {
						if (isReadTab(value)) {
							setActiveTab(value)
						}
					}}
					value={activeTab}
				>
					<TabsList className='border-b-0' variant='line'>
						{READ_TAB_OPTIONS.map(tab => (
							<TabsTrigger className='gap-2' key={tab.value} value={tab.value}>
								<span>{tab.label}</span>
								<CountBadge
									className='h-4 min-w-4 px-1 text-[10px]'
									count={tabCounts[tab.value]}
								/>
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</PageLayout.Header>
			<PageLayout.Content className='max-w-screen px-6 pt-3 pb-6'>
				<div className='mb-4'>
					<EntityTypeFilter
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
					/>
				</div>
				<ReadSections
					emptyDescription={emptyStateCopy.description}
					emptyTitle={emptyStateCopy.title}
					isLoading={isLoading}
					renderItem={renderItem}
					sections={visibleSections}
				/>
			</PageLayout.Content>
		</PageLayout>
	)
}

function ReadSections({
	sections,
	isLoading,
	emptyTitle,
	emptyDescription,
	renderItem
}: {
	sections: Array<ReadSection>
	isLoading: boolean
	emptyTitle: string
	emptyDescription: string
	renderItem: (note: Note) => ReactNode
}) {
	if (isLoading) {
		return <MasonryLayoutSkeleton />
	}

	if (sections.length === 0) {
		return (
			<div className='py-6'>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<BookOpen />
						</EmptyMedia>
						<EmptyTitle>{emptyTitle}</EmptyTitle>
						<EmptyDescription>{emptyDescription}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{sections.map(section => (
				<div className='space-y-3' key={section.id}>
					<h2 className='font-semibold text-lg'>{section.label}</h2>
					<MasonryLayout
						estimateItemSize={estimateNoteSize}
						gap={16}
						getItemKey={getNoteKey}
						items={section.items}
						renderItem={renderItem}
					/>
				</div>
			))}
		</div>
	)
}
