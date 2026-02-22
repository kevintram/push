import { useQueries } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
	Anvil,
	Archive,
	BookOpen,
	Brain,
	ChevronDown,
	Inbox,
	Loader2,
	MoreHorizontal,
	Plus,
	Sparkles,
	Star,
	User2,
	X
} from 'lucide-react'
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react'
import { toast } from 'sonner'
import {
	type DetailTabDefinition,
	DetailTabsShell
} from '~/components/DetailTabs'
import {
	type EntityType,
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { AddEntityMenu } from '~/components/ui/add-entity-menu'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { DetailNavBar, type DetailNavTab } from '~/components/ui/detail-nav-bar'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Textarea } from '~/components/ui/textarea'
import { Toggle } from '~/components/ui/toggle'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { useAddNoteRelation } from '~/features/notes/api/addNoteRelation'
import { getNote, useNote } from '~/features/notes/api/getNote'
import { useNoteRelations } from '~/features/notes/api/getNoteRelations'
import { useNotes } from '~/features/notes/api/getNotes'
import { noteKeys } from '~/features/notes/api/queryKeys'
import { useRemoveNoteRelation } from '~/features/notes/api/removeNoteRelation'
import { useUpdateNote } from '~/features/notes/api/updateNote'
import {
	useAddNoteTag,
	useRemoveNoteTag
} from '~/features/notes/api/updateNoteTags'
import {
	AddNoteDialog,
	type AddNoteDialogDefaults
} from '~/features/notes/components/AddNoteDialog'
import {
	NoteCard,
	toNoteCardStatusBadge
} from '~/features/notes/components/NoteCard'
import { NoteReadingStatusPopover } from '~/features/notes/components/NoteReadingStatusPopover'
import { NOTE_TAG_OPTIONS } from '~/features/notes/constants/noteTagOptions'
import {
	getReadingStatusOption,
	READING_STATUS_OPTIONS
} from '~/features/notes/constants/readingStatusOptions'
import type {
	Note,
	NoteRelationType,
	NoteTag
} from '~/features/notes/types/note.types'
import { orderNoteStatusBadges } from '~/features/notes/utils/orderNoteStatusBadges'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviewsByNote } from '~/features/reviews/api/getReviews'
import { RatingDropdown } from '~/features/reviews/components/RatingDropdown'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import type { ReviewRatingState } from '~/features/reviews/components/ReviewRatingCheckbox'
import { useDetailReviewCounts } from '~/features/reviews/hooks/useDetailReviewCounts'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import type { ReviewListItem } from '~/features/reviews/types/review.types'
import {
	getReviewCreatedToastActionLabel,
	getReviewCreatedToastDescription
} from '~/features/reviews/utils/reviewToastDescription'
import { SearchDialog } from '~/features/search/components/SearchDialog'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { useNoteNavigation } from '~/hooks/useNoteNavigation'
import { useFlashcardMode } from '~/stores/FlashcardModeContext'
import { localDateString } from '~/utils/date'
import { estimateCardSize } from '~/utils/estimateCardSize'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import { getRatingIcon } from '~/utils/getRatingIcon'

function toFreshnessTier(
	value: string | null
): 'Fresh' | 'Fine' | 'Hazy' | 'Forgotten' | null {
	if (
		value === 'Fresh' ||
		value === 'Fine' ||
		value === 'Hazy' ||
		value === 'Forgotten'
	) {
		return value
	}
	return null
}

function splitReviews(reviews: Array<ReviewListItem>) {
	const today = localDateString()
	const uncompletedUnscheduled: Array<ReviewListItem> = []
	const overdue: Array<ReviewListItem> = []
	const todayReviews: Array<ReviewListItem> = []
	const upcoming: Array<ReviewListItem> = []
	const completed: Array<ReviewListItem> = []

	for (const review of reviews) {
		if (review.completed_at) {
			completed.push(review)
			continue
		}

		if (review.scheduled_at || review.effective_date) {
			const date = review.effective_date ?? review.scheduled_at
			if (date && date < today) {
				overdue.push(review)
			} else if (date && date === today) {
				todayReviews.push(review)
			} else {
				upcoming.push(review)
			}
			continue
		}

		uncompletedUnscheduled.push(review)
	}

	const sortByEffectiveDateAsc = (a: ReviewListItem, b: ReviewListItem) =>
		new Date(a.effective_date ?? 0).getTime() -
		new Date(b.effective_date ?? 0).getTime()

	overdue.sort(sortByEffectiveDateAsc)
	todayReviews.sort(sortByEffectiveDateAsc)
	upcoming.sort(sortByEffectiveDateAsc)
	uncompletedUnscheduled.sort((a, b) => {
		return new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
	})
	completed.sort((a, b) => {
		return (
			new Date(b.completed_at ?? b.effective_date ?? 0).getTime() -
			new Date(a.completed_at ?? a.effective_date ?? 0).getTime()
		)
	})

	return {
		uncompletedUnscheduledReviews: uncompletedUnscheduled,
		overdueReviews: overdue,
		todayReviews,
		upcomingReviews: upcoming,
		completedReviews: completed
	}
}

function noteMatchesFilter(note: Note, filter: EntityTypeFilterValue) {
	if (filter === 'all') return true
	if (filter === 'none') return note.tags.length === 0
	if (filter === 'topic') return note.tags.includes('TOPIC')
	if (filter === 'source') return note.tags.includes('SOURCE')
	return note.tags.includes('PRACTICE')
}

function NoteGrid({
	notes,
	onNoteClick,
	activeFilter,
	onFilterChange,
	allowedTypes = ['topic', 'source', 'practice'],
	showAllOption = true,
	showNoTagOption = true,
	actions,
	isLoading = false,
	minCardHeight = 140,
	getScrollElement
}: {
	notes: Array<Note>
	onNoteClick: (noteId: number) => void
	activeFilter: EntityTypeFilterValue
	onFilterChange: (filter: EntityTypeFilterValue) => void
	allowedTypes?: Array<EntityType>
	showAllOption?: boolean
	showNoTagOption?: boolean
	actions?: ReactNode
	isLoading?: boolean
	minCardHeight?: number
	getScrollElement?: () => HTMLDivElement | null
}) {
	const filteredNotes = useMemo(
		() => notes.filter(note => noteMatchesFilter(note, activeFilter)),
		[notes, activeFilter]
	)
	const content = useMemo(() => {
		if (isLoading) {
			return <LoadingSpinner containerClassName='min-h-40 py-2' />
		}
		if (filteredNotes.length === 0) {
			return null
		}
		return (
			<MasonryLayout
				estimateItemSize={(note, _index, laneWidth) =>
					Math.max(
						estimateCardSize(
							note.title || 'Untitled note',
							note.body || '',
							laneWidth
						),
						minCardHeight
					)
				}
				gap={16}
				getItemKey={note => `note-${note.id}`}
				getScrollElement={getScrollElement}
				items={filteredNotes}
				renderItem={relatedNote => (
					<NoteCard
						minHeight={minCardHeight}
						note={relatedNote}
						onClick={() => onNoteClick(relatedNote.id)}
					/>
				)}
			/>
		)
	}, [filteredNotes, getScrollElement, isLoading, minCardHeight, onNoteClick])

	return (
		<div className='space-y-5 pb-2'>
			<div className='flex flex-wrap items-center gap-2'>
				<div className='flex min-w-0 flex-wrap items-center gap-2'>
					<EntityTypeFilter
						activeFilter={activeFilter}
						allowedTypes={allowedTypes}
						onFilterChange={onFilterChange}
						showAllOption={showAllOption}
						showNoTagOption={showNoTagOption}
					/>
				</div>
				{actions ? (
					<div className='ml-auto flex items-center'>{actions}</div>
				) : null}
			</div>
			{content}
		</div>
	)
}

type NoteHomeTab =
	| 'contents'
	| 'practice'
	| 'prerequisites'
	| 'sources'
	| 'topics_covered'
	| 'assesses'
	| 'related'

type CreateRelationContext =
	| {
			relationType: NoteRelationType
			direction: 'from_current_to_new'
	  }
	| {
			relationType: NoteRelationType
			direction: 'from_new_to_current'
	  }

type SearchAddMode = 'tab' | 'parent'

function isNoteHomeTab(value: string): value is NoteHomeTab {
	return (
		value === 'contents' ||
		value === 'practice' ||
		value === 'prerequisites' ||
		value === 'sources' ||
		value === 'topics_covered' ||
		value === 'assesses' ||
		value === 'related'
	)
}

export function NoteDetailPage({ noteId }: { noteId: string }) {
	const numericNoteId = Number(noteId)
	const { data: note, isLoading } = useNote(
		Number.isNaN(numericNoteId) ? undefined : numericNoteId
	)
	const {
		mutate: updateNote,
		mutateAsync: updateNoteAsync,
		isPending: isUpdatingNote
	} = useUpdateNote()
	const addNoteRelationMutation = useAddNoteRelation()
	const removeNoteRelationMutation = useRemoveNoteRelation()
	const { mutate: addNoteTag, isPending: isAddingNoteTag } = useAddNoteTag()
	const { mutate: removeNoteTag, isPending: isRemovingNoteTag } =
		useRemoveNoteTag()
	const navigateToNote = useNoteNavigation()
	const [activeNavTab, setActiveNavTab] = useState<DetailNavTab>('home')
	const [activeHomeTab, setActiveHomeTab] = useState<NoteHomeTab>('contents')
	const [activeHomeFilter, setActiveHomeFilter] =
		useState<EntityTypeFilterValue>('all')
	const [tagMenuSide, setTagMenuSide] = useState<'left' | 'bottom'>('left')
	const tagMenuTriggerRef = useRef<HTMLButtonElement>(null)
	const [isSearchAddOpen, setIsSearchAddOpen] = useState(false)
	const [searchAddMode, setSearchAddMode] = useState<SearchAddMode>('tab')
	const [searchAddQuery, setSearchAddQuery] = useState('')
	const [searchAddTab, setSearchAddTab] = useState<NoteHomeTab>('contents')
	const [isSearchAddMutating, setIsSearchAddMutating] = useState(false)
	const [searchAddPendingNoteId, setSearchAddPendingNoteId] = useState<
		number | null
	>(null)
	const contentScrollRef = useRef<HTMLDivElement>(null)
	const getContentScrollElement = useCallback(
		() => contentScrollRef.current,
		[]
	)

	const [title, setTitle] = useState('')
	const [body, setBody] = useState('')
	const [isReadingStatusOpen, setIsReadingStatusOpen] = useState(false)
	const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false)
	const [addNoteDefaults, setAddNoteDefaults] =
		useState<AddNoteDialogDefaults>()
	const [addRelationContext, setAddRelationContext] =
		useState<CreateRelationContext | null>(null)
	const [addParentOnCreate, setAddParentOnCreate] = useState(false)
	const { hidesPrimary, hidesSecondary } = useFlashcardMode()
	const [isTitleRevealed, setIsTitleRevealed] = useState(!hidesPrimary)
	const [isBodyRevealed, setIsBodyRevealed] = useState(!hidesSecondary)

	useEffect(() => {
		if (!note) return
		setTitle(note.title)
		setBody(note.body)
	}, [note])

	useEffect(() => {
		setIsTitleRevealed(!hidesPrimary)
		setIsBodyRevealed(!hidesSecondary)
	}, [hidesPrimary, hidesSecondary, numericNoteId])

	useEffect(() => {
		if (Number.isNaN(numericNoteId)) return
		setIsReadingStatusOpen(false)
	}, [numericNoteId])

	const { data: childNotes = [], isLoading: isChildrenLoading } = useNotes(
		{
			parent_id: note?.id,
			archived: false,
			order: 'desc'
		},
		{
			enabled: note !== undefined
		}
	)

	const { data: outgoingRelated = [], isLoading: isOutgoingRelatedLoading } =
		useNoteRelations(note?.id, {
			relationType: 'RELATED',
			direction: 'outgoing'
		})
	const { data: incomingRelated = [], isLoading: isIncomingRelatedLoading } =
		useNoteRelations(note?.id, {
			relationType: 'RELATED',
			direction: 'incoming'
		})
	const {
		data: outgoingPrerequisites = [],
		isLoading: isOutgoingPrerequisitesLoading
	} = useNoteRelations(note?.id, {
		relationType: 'PREREQUISITE',
		direction: 'outgoing'
	})
	const { data: outgoingCovers = [], isLoading: isOutgoingCoversLoading } =
		useNoteRelations(note?.id, {
			relationType: 'COVERS',
			direction: 'outgoing'
		})
	const { data: incomingCovers = [], isLoading: isIncomingCoversLoading } =
		useNoteRelations(note?.id, {
			relationType: 'COVERS',
			direction: 'incoming'
		})
	const { data: outgoingAssesses = [], isLoading: isOutgoingAssessesLoading } =
		useNoteRelations(note?.id, {
			relationType: 'ASSESSES',
			direction: 'outgoing'
		})
	const { data: incomingAssesses = [], isLoading: isIncomingAssessesLoading } =
		useNoteRelations(note?.id, {
			relationType: 'ASSESSES',
			direction: 'incoming'
		})

	const relatedIds = useMemo(() => {
		if (!note) return []
		const ids = new Set<number>()
		for (const relation of outgoingRelated) {
			if (relation.to_id !== note.id) ids.add(relation.to_id)
		}
		for (const relation of incomingRelated) {
			if (relation.from_id !== note.id) ids.add(relation.from_id)
		}
		return [...ids]
	}, [note, outgoingRelated, incomingRelated])
	const prerequisiteIds = useMemo(() => {
		if (!note) return []
		const ids = new Set<number>()
		for (const relation of outgoingPrerequisites) {
			if (relation.to_id !== note.id) ids.add(relation.to_id)
		}
		return [...ids]
	}, [note, outgoingPrerequisites])
	const coveredTopicIds = useMemo(() => {
		if (!note) return []
		const ids = new Set<number>()
		for (const relation of outgoingCovers) {
			if (relation.to_id !== note.id) ids.add(relation.to_id)
		}
		return [...ids]
	}, [note, outgoingCovers])
	const sourceIds = useMemo(() => {
		if (!note) return []
		const ids = new Set<number>()
		for (const relation of incomingCovers) {
			if (relation.from_id !== note.id) ids.add(relation.from_id)
		}
		return [...ids]
	}, [note, incomingCovers])
	const assessesIds = useMemo(() => {
		if (!note) return []
		const ids = new Set<number>()
		for (const relation of outgoingAssesses) {
			if (relation.to_id !== note.id) ids.add(relation.to_id)
		}
		return [...ids]
	}, [note, outgoingAssesses])
	const practiceIds = useMemo(() => {
		if (!note) return []
		const ids = new Set<number>()
		for (const relation of incomingAssesses) {
			if (relation.from_id !== note.id) ids.add(relation.from_id)
		}
		return [...ids]
	}, [note, incomingAssesses])

	const relatedQueries = useQueries({
		queries: relatedIds.map(relatedId => ({
			queryKey: noteKeys.detail(relatedId),
			queryFn: () => getNote(relatedId),
			staleTime: 30_000
		}))
	})
	const prerequisiteQueries = useQueries({
		queries: prerequisiteIds.map(relatedId => ({
			queryKey: noteKeys.detail(relatedId),
			queryFn: () => getNote(relatedId),
			staleTime: 30_000
		}))
	})
	const coveredTopicQueries = useQueries({
		queries: coveredTopicIds.map(relatedId => ({
			queryKey: noteKeys.detail(relatedId),
			queryFn: () => getNote(relatedId),
			staleTime: 30_000
		}))
	})
	const sourceQueries = useQueries({
		queries: sourceIds.map(relatedId => ({
			queryKey: noteKeys.detail(relatedId),
			queryFn: () => getNote(relatedId),
			staleTime: 30_000
		}))
	})
	const assessesQueries = useQueries({
		queries: assessesIds.map(relatedId => ({
			queryKey: noteKeys.detail(relatedId),
			queryFn: () => getNote(relatedId),
			staleTime: 30_000
		}))
	})
	const practiceQueries = useQueries({
		queries: practiceIds.map(relatedId => ({
			queryKey: noteKeys.detail(relatedId),
			queryFn: () => getNote(relatedId),
			staleTime: 30_000
		}))
	})

	const relatedNotes = useMemo(
		() =>
			relatedQueries
				.map(query => query.data)
				.filter((entry): entry is Note => entry !== undefined),
		[relatedQueries]
	)
	const prerequisiteNotes = useMemo(
		() =>
			prerequisiteQueries
				.map(query => query.data)
				.filter((entry): entry is Note => entry !== undefined),
		[prerequisiteQueries]
	)
	const coveredTopicNotes = useMemo(
		() =>
			coveredTopicQueries
				.map(query => query.data)
				.filter((entry): entry is Note => entry !== undefined),
		[coveredTopicQueries]
	)
	const sourceNotes = useMemo(
		() =>
			sourceQueries
				.map(query => query.data)
				.filter((entry): entry is Note => entry !== undefined),
		[sourceQueries]
	)
	const assessesNotes = useMemo(
		() =>
			assessesQueries
				.map(query => query.data)
				.filter((entry): entry is Note => entry !== undefined),
		[assessesQueries]
	)
	const practiceNotes = useMemo(
		() =>
			practiceQueries
				.map(query => query.data)
				.filter((entry): entry is Note => entry !== undefined),
		[practiceQueries]
	)
	const isRelatedLoading =
		isOutgoingRelatedLoading ||
		isIncomingRelatedLoading ||
		relatedQueries.some(query => query.isLoading)
	const isPrerequisitesLoading =
		isOutgoingPrerequisitesLoading ||
		prerequisiteQueries.some(query => query.isLoading)
	const isCoveredTopicsLoading =
		isOutgoingCoversLoading ||
		coveredTopicQueries.some(query => query.isLoading)
	const isSourcesLoading =
		isIncomingCoversLoading || sourceQueries.some(query => query.isLoading)
	const isAssessesLoading =
		isOutgoingAssessesLoading || assessesQueries.some(query => query.isLoading)
	const isPracticeLoading =
		isIncomingAssessesLoading || practiceQueries.some(query => query.isLoading)

	const contentsNotes = useMemo(() => childNotes, [childNotes])

	const { unscheduledCount, overdueCount, dueTodayCount } =
		useDetailReviewCounts(note ? { noteId: note.id } : undefined)
	const { data: reviews = [], isLoading: isReviewsLoading } = useReviewsByNote(
		note?.id
	)
	const {
		uncompletedUnscheduledReviews,
		overdueReviews,
		todayReviews,
		upcomingReviews,
		completedReviews
	} = useMemo(() => splitReviews(reviews), [reviews])

	const metrics = useLearnableMetrics(
		note
			? {
					retrievability: note.retrievability,
					freshness_tier: toFreshnessTier(note.freshness_tier),
					days_until_next_tier: note.days_until_next_tier,
					stability: note.stability,
					last_reviewed_at: note.last_reviewed_at,
					inherited_stability: null,
					srs_enabled: note.srs_enabled
				}
			: null
	)

	const { freshnessTierInfo, freshnessTierColor, isUnreviewed, stabilityText } =
		metrics

	const latestCompletedReview = useMemo(() => {
		let latest: (typeof reviews)[number] | null = null
		for (const review of reviews) {
			if (!review.completed_at) continue
			if (!latest) {
				latest = review
				continue
			}
			if (
				new Date(review.completed_at).getTime() >
				new Date(latest.completed_at ?? 0).getTime()
			) {
				latest = review
			}
		}
		return latest
	}, [reviews])

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(
				latestCompletedReview?.completed_at ?? note?.last_reviewed_at ?? null,
				{
					includeFuture: false,
					nullLabel: 'never'
				}
			),
		[latestCompletedReview?.completed_at, note?.last_reviewed_at]
	)

	const createReviewMutation = useCreateReview()
	const isCreatingReview = createReviewMutation.isPending
	const { openReviewDialog } = useReviewDialog()
	const noteStatusBadges = useMemo(
		() =>
			orderNoteStatusBadges(note?.status_badges ?? []).map(apiBadge =>
				toNoteCardStatusBadge(apiBadge, {
					onOpenReviewDialog: openReviewDialog
				})
			),
		[note?.status_badges, openReviewDialog]
	)

	const handleRatingSelect = useCallback(
		async (ratingState: ReviewRatingState) => {
			if (!note || isCreatingReview) return

			try {
				const review = await createReviewMutation.mutateAsync({
					note_id: note.id,
					rating: ratingState === 'uncompleted' ? null : ratingState,
					description: '',
					scheduled_at: null,
					completed_at: ratingState === 'uncompleted' ? null : localDateString()
				})

				toast('Review created', {
					description: getReviewCreatedToastDescription(review),
					action: {
						label: getReviewCreatedToastActionLabel(review),
						onClick: () => openReviewDialog(review.id)
					}
				})
			} catch {
				toast.error('Failed to create review')
			}
		},
		[note, createReviewMutation, isCreatingReview, openReviewDialog]
	)

	const handleOpenAddChildNoteDialog = useCallback(() => {
		if (!note) return

		let defaults: AddNoteDialogDefaults = {}
		let relationContext: CreateRelationContext | null = null

		if (activeHomeTab === 'contents') {
			defaults = { parent_id: note.id }
		} else if (activeHomeTab === 'practice') {
			defaults = { tags: ['PRACTICE'] }
			relationContext = {
				relationType: 'ASSESSES',
				direction: 'from_new_to_current'
			}
		} else if (activeHomeTab === 'sources') {
			defaults = { tags: ['SOURCE'] }
			relationContext = {
				relationType: 'COVERS',
				direction: 'from_new_to_current'
			}
		} else if (activeHomeTab === 'topics_covered') {
			defaults = { tags: ['TOPIC'] }
			relationContext = {
				relationType: 'COVERS',
				direction: 'from_current_to_new'
			}
		} else if (activeHomeTab === 'assesses') {
			defaults = { tags: ['TOPIC'] }
			relationContext = {
				relationType: 'ASSESSES',
				direction: 'from_current_to_new'
			}
		} else if (activeHomeTab === 'related') {
			relationContext = {
				relationType: 'RELATED',
				direction: 'from_current_to_new'
			}
		} else if (activeHomeTab === 'prerequisites') {
			relationContext = {
				relationType: 'PREREQUISITE',
				direction: 'from_current_to_new'
			}
		}

		setAddNoteDefaults(defaults)
		setAddRelationContext(relationContext)
		setAddParentOnCreate(false)
		setIsAddNoteDialogOpen(true)
	}, [activeHomeTab, note])

	const handleOpenAddParentDialog = useCallback(() => {
		if (!note) return
		setAddNoteDefaults({})
		setAddRelationContext(null)
		setAddParentOnCreate(true)
		setIsAddNoteDialogOpen(true)
	}, [note])

	const relatedAllowedTypes = ['topic', 'source', 'practice'] as const
	const tabFilterConfig = useMemo<
		Record<
			NoteHomeTab,
			{
				allowedTypes: Array<EntityType>
				showAllOption: boolean
				showNoTagOption: boolean
			}
		>
	>(
		() => ({
			contents: {
				allowedTypes: ['topic', 'source', 'practice'],
				showAllOption: true,
				showNoTagOption: true
			},
			practice: {
				allowedTypes: ['practice'],
				showAllOption: false,
				showNoTagOption: false
			},
			prerequisites: {
				allowedTypes: ['topic', 'source', 'practice'],
				showAllOption: true,
				showNoTagOption: true
			},
			sources: {
				allowedTypes: ['source'],
				showAllOption: false,
				showNoTagOption: false
			},
			topics_covered: {
				allowedTypes: ['topic'],
				showAllOption: false,
				showNoTagOption: false
			},
			assesses: {
				allowedTypes: ['topic', 'source'],
				showAllOption: true,
				showNoTagOption: false
			},
			related: {
				allowedTypes: [...relatedAllowedTypes],
				showAllOption: true,
				showNoTagOption: true
			}
		}),
		[relatedAllowedTypes]
	)
	const activeHomeTabFilterConfig = useMemo(
		() =>
			tabFilterConfig[activeHomeTab] ?? {
				allowedTypes: ['topic', 'source', 'practice'],
				showAllOption: true,
				showNoTagOption: true
			},
		[tabFilterConfig, activeHomeTab]
	)

	useEffect(() => {
		const fallbackFilter: EntityTypeFilterValue =
			activeHomeTabFilterConfig.showAllOption
				? 'all'
				: (activeHomeTabFilterConfig.allowedTypes[0] ?? 'all')

		if (activeHomeFilter === 'all') {
			if (!activeHomeTabFilterConfig.showAllOption) {
				setActiveHomeFilter(fallbackFilter)
			}
			return
		}

		if (activeHomeFilter === 'none') {
			if (!activeHomeTabFilterConfig.showNoTagOption) {
				setActiveHomeFilter(fallbackFilter)
			}
			return
		}

		if (activeHomeTabFilterConfig.allowedTypes.includes(activeHomeFilter))
			return
		setActiveHomeFilter(fallbackFilter)
	}, [activeHomeFilter, activeHomeTabFilterConfig])
	const childNoteIds = useMemo(
		() => new Set(childNotes.map(childNote => childNote.id)),
		[childNotes]
	)
	const relatedIdSet = useMemo(() => new Set(relatedIds), [relatedIds])
	const prerequisiteIdSet = useMemo(
		() => new Set(prerequisiteIds),
		[prerequisiteIds]
	)
	const coveredTopicIdSet = useMemo(
		() => new Set(coveredTopicIds),
		[coveredTopicIds]
	)
	const sourceIdSet = useMemo(() => new Set(sourceIds), [sourceIds])
	const practiceIdSet = useMemo(() => new Set(practiceIds), [practiceIds])
	const assessesIdSet = useMemo(() => new Set(assessesIds), [assessesIds])

	const searchAddFilterConfig = useMemo(
		() =>
			tabFilterConfig[searchAddTab] ?? {
				allowedTypes: ['topic', 'source', 'practice'],
				showAllOption: true,
				showNoTagOption: true
			},
		[tabFilterConfig, searchAddTab]
	)
	const searchAddAllowedTypes = useMemo<Array<EntityType>>(
		() =>
			searchAddMode === 'parent'
				? ['topic', 'source', 'practice']
				: searchAddFilterConfig.allowedTypes,
		[searchAddFilterConfig, searchAddMode]
	)
	const searchAddShowAllOption =
		searchAddMode === 'parent' ? true : searchAddFilterConfig.showAllOption
	const searchAddShowNoTagOption =
		searchAddMode === 'parent' ? true : searchAddFilterConfig.showNoTagOption
	const searchAddInitialFilter = useMemo<EntityTypeFilterValue>(() => {
		if (searchAddMode === 'parent') {
			return 'all'
		}
		if (!searchAddFilterConfig.showAllOption) {
			return searchAddAllowedTypes[0] ?? 'all'
		}
		return searchAddAllowedTypes.length === 1
			? (searchAddAllowedTypes[0] ?? 'all')
			: 'all'
	}, [
		searchAddAllowedTypes,
		searchAddFilterConfig.showAllOption,
		searchAddMode
	])
	const searchAddAddedNoteIds = useMemo(() => {
		if (searchAddMode === 'parent') {
			return []
		}
		const excluded = new Set<number>()
		if (note) {
			excluded.add(note.id)
		}
		if (searchAddTab === 'contents') {
			for (const childNote of childNotes) {
				excluded.add(childNote.id)
			}
		}
		if (searchAddTab === 'practice') {
			for (const practiceId of practiceIds) {
				excluded.add(practiceId)
			}
		}
		if (searchAddTab === 'sources') {
			for (const sourceId of sourceIds) {
				excluded.add(sourceId)
			}
		}
		if (searchAddTab === 'related') {
			for (const relatedId of relatedIds) {
				excluded.add(relatedId)
			}
		}
		if (searchAddTab === 'prerequisites') {
			for (const prerequisiteId of prerequisiteIds) {
				excluded.add(prerequisiteId)
			}
		}
		if (searchAddTab === 'topics_covered') {
			for (const coveredTopicId of coveredTopicIds) {
				excluded.add(coveredTopicId)
			}
		}
		if (searchAddTab === 'assesses') {
			for (const assessesId of assessesIds) {
				excluded.add(assessesId)
			}
		}
		return [...excluded]
	}, [
		note,
		searchAddTab,
		childNotes,
		relatedIds,
		prerequisiteIds,
		sourceIds,
		practiceIds,
		coveredTopicIds,
		assessesIds,
		searchAddMode
	])
	const searchAddCustomStatusBadges = useMemo(() => {
		if (searchAddMode !== 'parent' || !note) return []
		return [
			{
				noteId: note.id,
				badge: {
					label: 'Current',
					tooltip: 'Current note',
					variant: 'outline' as const,
					className:
						'h-5 border border-border bg-muted text-muted-foreground text-xs'
				}
			}
		]
	}, [searchAddMode, note])
	const searchAddTitle = useMemo(() => {
		if (searchAddMode === 'parent') {
			return 'Search parent note'
		}
		if (searchAddTab === 'practice') {
			return 'Search practices'
		}
		if (searchAddTab === 'assesses') {
			return 'Search topics or sources'
		}
		if (searchAddTab === 'sources') {
			return 'Search sources'
		}
		if (searchAddTab === 'topics_covered') {
			return 'Search topics'
		}
		return 'Search notes'
	}, [searchAddMode, searchAddTab])

	const handleHomeTabChange = useCallback((value: string) => {
		if (isNoteHomeTab(value)) {
			setActiveHomeTab(value)
		}
	}, [])

	const handleOpenSearchAdd = useCallback(() => {
		if (!note) return
		setSearchAddMode('tab')
		setSearchAddTab(activeHomeTab)
		setSearchAddQuery('')
		setIsSearchAddOpen(true)
	}, [note, activeHomeTab])
	const handleOpenSearchParent = useCallback(() => {
		if (!note) return
		setSearchAddMode('parent')
		setSearchAddQuery('')
		setIsSearchAddOpen(true)
	}, [note])

	const handleSearchAddSelect = useCallback(
		async (selectedNote: Note) => {
			if (!note) return
			if (isSearchAddMutating) return
			if (selectedNote.id === note.id) {
				toast.error(
					searchAddMode === 'parent'
						? 'Cannot set this note as its own parent'
						: 'Cannot add this note to itself'
				)
				return
			}
			if (searchAddMode === 'parent') {
				setIsSearchAddMutating(true)
				setSearchAddPendingNoteId(selectedNote.id)
				try {
					await updateNoteAsync({
						id: note.id,
						parent_id: selectedNote.id
					})
					toast.success('Parent added')
					setIsSearchAddOpen(false)
				} catch {
					toast.error('Failed to set parent')
				} finally {
					setIsSearchAddMutating(false)
					setSearchAddPendingNoteId(null)
				}
				return
			}

			if (searchAddTab === 'contents') {
				const isAlreadyAdded = childNoteIds.has(selectedNote.id)
				setIsSearchAddMutating(true)
				setSearchAddPendingNoteId(selectedNote.id)
				try {
					if (isAlreadyAdded) {
						await updateNoteAsync({
							id: selectedNote.id,
							parent_id: null
						})
						toast.success('Note removed')
					} else {
						await updateNoteAsync({
							id: selectedNote.id,
							parent_id: note.id
						})
						toast.success('Note added')
					}
				} catch {
					toast.error(
						isAlreadyAdded ? 'Failed to remove note' : 'Failed to add note'
					)
				} finally {
					setIsSearchAddMutating(false)
					setSearchAddPendingNoteId(null)
				}
				return
			}

			let relationType: NoteRelationType
			let existingIds: Set<number>
			if (searchAddTab === 'related') {
				relationType = 'RELATED'
				existingIds = relatedIdSet
			} else if (searchAddTab === 'practice') {
				relationType = 'ASSESSES'
				existingIds = practiceIdSet
			} else if (searchAddTab === 'sources') {
				relationType = 'COVERS'
				existingIds = sourceIdSet
			} else if (searchAddTab === 'prerequisites') {
				relationType = 'PREREQUISITE'
				existingIds = prerequisiteIdSet
			} else if (searchAddTab === 'topics_covered') {
				relationType = 'COVERS'
				existingIds = coveredTopicIdSet
			} else {
				relationType = 'ASSESSES'
				existingIds = assessesIdSet
			}

			const hasOutgoingRelatedRelation =
				searchAddTab === 'related'
					? outgoingRelated.some(relation => relation.to_id === selectedNote.id)
					: false
			const hasIncomingRelatedRelation =
				searchAddTab === 'related'
					? incomingRelated.some(
							relation => relation.from_id === selectedNote.id
						)
					: false
			const isAlreadyAdded =
				searchAddTab === 'related'
					? hasOutgoingRelatedRelation || hasIncomingRelatedRelation
					: existingIds.has(selectedNote.id)
			if (
				!isAlreadyAdded &&
				searchAddTab === 'practice' &&
				!selectedNote.tags.includes('PRACTICE')
			) {
				toast.error('Select a practice note')
				return
			}
			if (
				!isAlreadyAdded &&
				searchAddTab === 'sources' &&
				!selectedNote.tags.includes('SOURCE')
			) {
				toast.error('Select a source note')
				return
			}
			if (
				!isAlreadyAdded &&
				searchAddTab === 'assesses' &&
				!(
					selectedNote.tags.includes('TOPIC') ||
					selectedNote.tags.includes('SOURCE')
				)
			) {
				toast.error('Select a topic or source note')
				return
			}

			setIsSearchAddMutating(true)
			setSearchAddPendingNoteId(selectedNote.id)
			try {
				if (isAlreadyAdded) {
					if (searchAddTab === 'related') {
						const removals: Array<Promise<void>> = []
						if (hasOutgoingRelatedRelation) {
							removals.push(
								removeNoteRelationMutation.mutateAsync({
									noteId: note.id,
									otherNoteId: selectedNote.id,
									relationType,
									direction: 'outgoing'
								})
							)
						}
						if (hasIncomingRelatedRelation) {
							removals.push(
								removeNoteRelationMutation.mutateAsync({
									noteId: note.id,
									otherNoteId: selectedNote.id,
									relationType,
									direction: 'incoming'
								})
							)
						}
						await Promise.all(removals)
					} else if (
						searchAddTab === 'sources' ||
						searchAddTab === 'practice'
					) {
						await removeNoteRelationMutation.mutateAsync({
							noteId: note.id,
							otherNoteId: selectedNote.id,
							relationType,
							direction: 'incoming'
						})
					} else {
						await removeNoteRelationMutation.mutateAsync({
							noteId: note.id,
							otherNoteId: selectedNote.id,
							relationType,
							direction: 'outgoing'
						})
					}
					toast.success('Note removed')
				} else if (searchAddTab === 'sources' || searchAddTab === 'practice') {
					await addNoteRelationMutation.mutateAsync({
						noteId: selectedNote.id,
						toId: note.id,
						relationType
					})
					toast.success('Note added')
				} else {
					await addNoteRelationMutation.mutateAsync({
						noteId: note.id,
						toId: selectedNote.id,
						relationType
					})
					toast.success('Note added')
				}
			} catch {
				toast.error(
					isAlreadyAdded ? 'Failed to remove note' : 'Failed to add note'
				)
			} finally {
				setIsSearchAddMutating(false)
				setSearchAddPendingNoteId(null)
			}
		},
		[
			note,
			isSearchAddMutating,
			searchAddMode,
			searchAddTab,
			childNoteIds,
			updateNoteAsync,
			relatedIdSet,
			sourceIdSet,
			practiceIdSet,
			prerequisiteIdSet,
			coveredTopicIdSet,
			assessesIdSet,
			addNoteRelationMutation,
			removeNoteRelationMutation,
			outgoingRelated,
			incomingRelated
		]
	)

	const handleAddNoteSuccess = useCallback(
		async (createdNote: Note) => {
			if (!note) return

			if (addParentOnCreate) {
				try {
					await updateNoteAsync({
						id: note.id,
						parent_id: createdNote.id
					})
					toast.success('Parent added')
				} catch {
					toast.error('Parent created but failed to set')
				}
				return
			}

			if (!addRelationContext) return

			try {
				if (addRelationContext.direction === 'from_new_to_current') {
					await addNoteRelationMutation.mutateAsync({
						noteId: createdNote.id,
						toId: note.id,
						relationType: addRelationContext.relationType
					})
					return
				}

				await addNoteRelationMutation.mutateAsync({
					noteId: note.id,
					toId: createdNote.id,
					relationType: addRelationContext.relationType
				})
			} catch {
				toast.error('Note created but failed to link relation')
			}
		},
		[
			note,
			addRelationContext,
			addNoteRelationMutation,
			addParentOnCreate,
			updateNoteAsync
		]
	)
	const handleAddNoteDialogOpenChange = useCallback((open: boolean) => {
		setIsAddNoteDialogOpen(open)
		if (!open) {
			setAddRelationContext(null)
			setAddParentOnCreate(false)
		}
	}, [])

	if (isLoading || !note) {
		return (
			<div className='flex h-full min-h-0 w-full flex-col'>
				<div className='flex min-h-[70vh] w-full items-center justify-center px-6 py-4'>
					<LoadingSpinner containerClassName='h-auto w-auto py-0' />
				</div>
			</div>
		)
	}

	const currentStatusOption = getReadingStatusOption(note.reading_status)
	const CurrentStatusIcon = currentStatusOption.icon
	const isUpdatingTags = isAddingNoteTag || isRemovingNoteTag
	const parentLabel =
		note.parent_title?.trim() ||
		(note.parent_id != null ? `#${note.parent_id}` : 'None')
	const hasTopicTag = note.tags.includes('TOPIC')
	const hasSourceTag = note.tags.includes('SOURCE')
	const hasPracticeTag = note.tags.includes('PRACTICE')
	const selectedTagOptions = NOTE_TAG_OPTIONS.filter(option =>
		note.tags.includes(option.value)
	)
	const showPracticeTab = hasTopicTag || hasSourceTag
	const toggleTag = (tag: NoteTag) => {
		const removing = note.tags.includes(tag)
		if (removing) {
			const remainingTags = note.tags.filter(existing => existing !== tag)
			const remainingHasTopic = remainingTags.includes('TOPIC')
			const remainingHasSource = remainingTags.includes('SOURCE')
			const remainingHasPractice = remainingTags.includes('PRACTICE')
			const remainingShowPracticeTab = remainingHasTopic || remainingHasSource
			const currentTabStillAvailable =
				activeHomeTab === 'contents' ||
				(activeHomeTab === 'practice' && remainingShowPracticeTab) ||
				activeHomeTab === 'related' ||
				(activeHomeTab === 'sources' && remainingHasTopic) ||
				(activeHomeTab === 'topics_covered' && remainingHasSource) ||
				(activeHomeTab === 'assesses' && remainingHasPractice) ||
				(activeHomeTab === 'prerequisites' &&
					(remainingHasTopic || remainingHasSource))
			if (!currentTabStillAvailable) {
				setActiveHomeTab('contents')
			}
			removeNoteTag(
				{ noteId: note.id, tag },
				{
					onError: () => {
						toast.error('Failed to update tags')
					}
				}
			)
			return
		}
		addNoteTag(
			{ noteId: note.id, tag },
			{
				onError: () => {
					toast.error('Failed to update tags')
				}
			}
		)
	}
	const addToReadingList = () => {
		setIsReadingStatusOpen(true)
		updateNote({
			id: note.id,
			in_reading_list: true,
			reading_status: 'NEW'
		})
	}
	const updateTagMenuSide = (trigger?: HTMLButtonElement | null) => {
		const element = trigger ?? tagMenuTriggerRef.current
		if (!element) {
			setTagMenuSide('bottom')
			return
		}
		const leftSpace = element.getBoundingClientRect().left
		const menuWidth = 144
		const sideOffset = 6
		const edgePadding = 8
		const canOpenLeft = leftSpace - menuWidth - sideOffset >= edgePadding
		setTagMenuSide(canOpenLeft ? 'left' : 'bottom')
	}

	const addMenu = (
		<AddEntityMenu
			buttonSize='sm'
			createItems={[
				{ label: 'Create', onSelect: handleOpenAddChildNoteDialog }
			]}
			isLoading={isSearchAddMutating}
			onSearch={handleOpenSearchAdd}
			searchLabel='Search'
		/>
	)
	const addParentMenu = (
		<AddEntityMenu
			buttonClassName='h-6 rounded-full px-2 text-xs'
			buttonLabel='Add parent'
			buttonSize='sm'
			buttonVariant='ghost'
			createItems={[{ label: 'Create', onSelect: handleOpenAddParentDialog }]}
			disabled={isUpdatingNote}
			isLoading={isSearchAddMutating}
			onSearch={handleOpenSearchParent}
			searchLabel='Search'
			showChevron={false}
		/>
	)

	const tabs: Array<DetailTabDefinition> = [
		{
			value: 'contents',
			label: 'Contents',
			count: contentsNotes.length,
			content: (
				<NoteGrid
					actions={addMenu}
					activeFilter={activeHomeFilter}
					allowedTypes={tabFilterConfig.contents.allowedTypes}
					getScrollElement={getContentScrollElement}
					isLoading={isChildrenLoading}
					notes={contentsNotes}
					onFilterChange={setActiveHomeFilter}
					onNoteClick={navigateToNote}
					showAllOption={tabFilterConfig.contents.showAllOption}
					showNoTagOption={tabFilterConfig.contents.showNoTagOption}
				/>
			)
		}
	]

	if (showPracticeTab) {
		tabs.push({
			value: 'practice',
			label: 'Practice',
			count: practiceNotes.length,
			content: (
				<NoteGrid
					actions={addMenu}
					activeFilter={activeHomeFilter}
					allowedTypes={tabFilterConfig.practice.allowedTypes}
					getScrollElement={getContentScrollElement}
					isLoading={isPracticeLoading}
					notes={practiceNotes}
					onFilterChange={setActiveHomeFilter}
					onNoteClick={navigateToNote}
					showAllOption={tabFilterConfig.practice.showAllOption}
					showNoTagOption={tabFilterConfig.practice.showNoTagOption}
				/>
			)
		})
	}

	if (hasTopicTag || hasSourceTag) {
		tabs.push({
			value: 'prerequisites',
			label: 'Prerequisites',
			count: prerequisiteIds.length,
			content: (
				<NoteGrid
					actions={addMenu}
					activeFilter={activeHomeFilter}
					allowedTypes={tabFilterConfig.prerequisites.allowedTypes}
					getScrollElement={getContentScrollElement}
					isLoading={isPrerequisitesLoading}
					notes={prerequisiteNotes}
					onFilterChange={setActiveHomeFilter}
					onNoteClick={navigateToNote}
					showAllOption={tabFilterConfig.prerequisites.showAllOption}
					showNoTagOption={tabFilterConfig.prerequisites.showNoTagOption}
				/>
			)
		})
	}

	if (hasTopicTag) {
		tabs.push({
			value: 'sources',
			label: 'Sources',
			count: sourceNotes.length,
			content: (
				<NoteGrid
					actions={addMenu}
					activeFilter={activeHomeFilter}
					allowedTypes={tabFilterConfig.sources.allowedTypes}
					getScrollElement={getContentScrollElement}
					isLoading={isSourcesLoading}
					notes={sourceNotes}
					onFilterChange={setActiveHomeFilter}
					onNoteClick={navigateToNote}
					showAllOption={tabFilterConfig.sources.showAllOption}
					showNoTagOption={tabFilterConfig.sources.showNoTagOption}
				/>
			)
		})
	}

	if (hasSourceTag) {
		tabs.push({
			value: 'topics_covered',
			label: 'Topics covered',
			count: coveredTopicIds.length,
			content: (
				<NoteGrid
					actions={addMenu}
					activeFilter={activeHomeFilter}
					allowedTypes={tabFilterConfig.topics_covered.allowedTypes}
					getScrollElement={getContentScrollElement}
					isLoading={isCoveredTopicsLoading}
					notes={coveredTopicNotes}
					onFilterChange={setActiveHomeFilter}
					onNoteClick={navigateToNote}
					showAllOption={tabFilterConfig.topics_covered.showAllOption}
					showNoTagOption={tabFilterConfig.topics_covered.showNoTagOption}
				/>
			)
		})
	}

	if (hasPracticeTag) {
		tabs.push({
			value: 'assesses',
			label: 'Assesses',
			count: assessesIds.length,
			content: (
				<NoteGrid
					actions={addMenu}
					activeFilter={activeHomeFilter}
					allowedTypes={tabFilterConfig.assesses.allowedTypes}
					getScrollElement={getContentScrollElement}
					isLoading={isAssessesLoading}
					notes={assessesNotes}
					onFilterChange={setActiveHomeFilter}
					onNoteClick={navigateToNote}
					showAllOption={tabFilterConfig.assesses.showAllOption}
					showNoTagOption={tabFilterConfig.assesses.showNoTagOption}
				/>
			)
		})
	}

	tabs.push({
		value: 'related',
		label: 'Related',
		count: relatedIds.length,
		content: (
			<NoteGrid
				actions={addMenu}
				activeFilter={activeHomeFilter}
				allowedTypes={tabFilterConfig.related.allowedTypes}
				getScrollElement={getContentScrollElement}
				isLoading={isRelatedLoading}
				minCardHeight={96}
				notes={relatedNotes}
				onFilterChange={setActiveHomeFilter}
				onNoteClick={navigateToNote}
				showAllOption={tabFilterConfig.related.showAllOption}
				showNoTagOption={tabFilterConfig.related.showNoTagOption}
			/>
		)
	})

	return (
		<div className='flex h-full min-h-0 w-full flex-col'>
			<DetailNavBar
				activeTab={activeNavTab}
				afterActions={null}
				dueTodayCount={dueTodayCount}
				leftContent={
					hidesPrimary ? null : (
						<div className='flex min-w-0 items-center gap-2'>
							<div className='flex items-center gap-1 text-muted-foreground text-xs'>
								<User2 className='h-3 w-3' />
								<span>Parent</span>
							</div>
							{note.parent_id != null ? (
								<Badge
									className='group/parent h-6 rounded-full px-1 text-xs'
									variant='ghost'
								>
									<Button
										className='h-5 cursor-pointer rounded-full px-0 font-medium text-xs leading-none'
										onClick={() => navigateToNote(note.parent_id!)}
										size='xs'
										type='button'
										variant='ghost'
									>
										{parentLabel}
									</Button>
									<Button
										aria-label='Remove parent'
										className='pointer-events-none inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full p-0 opacity-0 transition-opacity focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/parent:pointer-events-auto group-hover/parent:opacity-100 group-active/parent:pointer-events-auto group-active/parent:opacity-100'
										disabled={isUpdatingNote}
										onClick={event => {
											event.stopPropagation()
											updateNote({ id: note.id, parent_id: null })
										}}
										size='icon-xs'
										type='button'
										variant='ghost'
									>
										<X className='h-3 w-3' />
									</Button>
								</Badge>
							) : (
								addParentMenu
							)}
						</div>
					)
				}
				onTabChange={setActiveNavTab}
				overdueCount={overdueCount}
				unscheduledCount={unscheduledCount}
			/>

			<div className='flex-1 overflow-y-auto' ref={contentScrollRef}>
				<div className='mx-auto w-full max-w-5xl px-6 py-5'>
					{activeNavTab === 'reviews' ? (
						isReviewsLoading ? (
							<LoadingSpinner containerClassName='min-h-40 py-2' />
						) : (
							<div className='space-y-6 py-2'>
								<div className='flex items-center justify-end'>
									<RatingDropdown
										align='end'
										onSelect={handleRatingSelect}
										trigger={
											<Button
												className='rounded-full'
												disabled={isCreatingReview}
												size='sm'
												variant='default'
											>
												{isCreatingReview ? (
													<Loader2 className='h-4 w-4 animate-spin' />
												) : (
													<Plus className='h-4 w-4' />
												)}
												Review
												<ChevronDown className='h-4 w-4' />
											</Button>
										}
									/>
								</div>
								{uncompletedUnscheduledReviews.length === 0 &&
								overdueReviews.length === 0 &&
								todayReviews.length === 0 &&
								upcomingReviews.length === 0 &&
								completedReviews.length === 0 ? null : (
									<div className='flex flex-col gap-10'>
										{uncompletedUnscheduledReviews.length > 0 && (
											<div>
												{uncompletedUnscheduledReviews.map(entry => (
													<ReviewItem
														entry={entry}
														key={entry.id}
														onReviewClick={openReviewDialog}
														variant='default'
													/>
												))}
											</div>
										)}
										{overdueReviews.length > 0 && (
											<div>
												<h2 className='mb-3 font-bold text-2xl text-red-600 dark:text-red-400'>
													Overdue
												</h2>
												{overdueReviews.map(entry => (
													<ReviewItem
														entry={entry}
														key={entry.id}
														onReviewClick={openReviewDialog}
														variant='default'
													/>
												))}
											</div>
										)}
										{todayReviews.length > 0 && (
											<div>
												<h2 className='mb-3 font-bold text-2xl text-blue-600 dark:text-blue-400'>
													Today
												</h2>
												{todayReviews.map(entry => (
													<ReviewItem
														entry={entry}
														key={entry.id}
														onReviewClick={openReviewDialog}
														variant='default'
													/>
												))}
											</div>
										)}
										{upcomingReviews.length > 0 && (
											<div>
												<h2 className='mb-3 font-bold text-2xl'>Upcoming</h2>
												{upcomingReviews.map(entry => (
													<ReviewItem
														entry={entry}
														key={entry.id}
														onReviewClick={openReviewDialog}
														variant='default'
													/>
												))}
											</div>
										)}
										{completedReviews.length > 0 && (
											<div>
												<h2 className='mb-3 font-bold text-2xl'>Completed</h2>
												{completedReviews.map(entry => (
													<ReviewItem
														entry={entry}
														key={entry.id}
														onReviewClick={openReviewDialog}
														variant='default'
													/>
												))}
											</div>
										)}
									</div>
								)}
							</div>
						)
					) : (
						<div className='space-y-2'>
							<div className='flex flex-wrap items-center justify-between gap-2'>
								<div className='flex min-w-0 flex-wrap items-center gap-2'>
									<DropdownMenu
										onOpenChange={nextOpen => {
											if (nextOpen) updateTagMenuSide()
										}}
									>
										<DropdownMenuTrigger
											render={
												<button
													className='flex items-center gap-2 bg-transparent p-0 text-left'
													disabled={isUpdatingTags}
													onPointerDown={event =>
														updateTagMenuSide(event.currentTarget)
													}
													ref={tagMenuTriggerRef}
													type='button'
												>
													<span className='text-muted-foreground text-sm'>
														Tags
													</span>
													{selectedTagOptions.map(option => (
														<Badge key={option.value} variant='secondary'>
															{option.label}
														</Badge>
													))}
													{selectedTagOptions.length === 0 ? (
														<span className='inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
															<Plus className='h-4 w-4' />
														</span>
													) : null}
												</button>
											}
										/>
										<DropdownMenuContent
											align='start'
											className='min-w-36'
											collisionAvoidance={{
												side: 'shift',
												align: 'shift',
												fallbackAxisSide: 'none'
											}}
											matchTriggerWidth={false}
											side={tagMenuSide}
											sideOffset={6}
										>
											<DropdownMenuGroup>
												{NOTE_TAG_OPTIONS.map(option => (
													<DropdownMenuCheckboxItem
														checked={note.tags.includes(option.value)}
														disabled={isUpdatingTags}
														key={option.value}
														onCheckedChange={() => toggleTag(option.value)}
													>
														{option.label}
													</DropdownMenuCheckboxItem>
												))}
											</DropdownMenuGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								<div className='flex flex-wrap items-center justify-end gap-1.5'>
									{noteStatusBadges.map((badge, index) => (
										<Tooltip key={`${badge.label}-${index}`}>
											<TooltipTrigger
												render={
													<Badge
														className={
															badge.className
																? `${badge.className} rounded-sm shadow-sm`
																: 'h-5 rounded-sm text-xs shadow-sm'
														}
														onClick={event => {
															if (!badge.onClick) return
															event.stopPropagation()
															badge.onClick()
														}}
														onKeyDown={event => {
															if (
																(event.key === 'Enter' || event.key === ' ') &&
																badge.onClick
															) {
																event.preventDefault()
																event.stopPropagation()
																badge.onClick()
															}
														}}
														role={badge.onClick ? 'button' : undefined}
														tabIndex={badge.onClick ? 0 : undefined}
														variant={badge.variant ?? 'outline'}
													>
														{badge.label ? <span>{badge.label}</span> : null}
													</Badge>
												}
											/>
											{badge.tooltip ? (
												<TooltipContent>{badge.tooltip}</TooltipContent>
											) : null}
										</Tooltip>
									))}
								</div>
							</div>

							{hidesPrimary && !isTitleRevealed ? (
								<Button
									className='my-1 min-h-12 w-full justify-center rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 px-2.5 py-2 font-bold text-3xl text-muted-foreground leading-tight hover:bg-muted/70'
									onClick={() => setIsTitleRevealed(true)}
									size='default'
									variant='outline'
								>
									Reveal
								</Button>
							) : (
								<Textarea
									className='!bg-transparent !text-3xl m-0 min-h-0 resize-none overflow-hidden break-words rounded-none border-none p-0 pb-1 font-bold leading-tight shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
									onBlur={() => {
										if (title !== note.title) {
											updateNote({ id: note.id, title })
										}
									}}
									onChange={event => setTitle(event.target.value)}
									placeholder='Untitled note'
									spellCheck={false}
									value={title}
								/>
							)}

							<div className='flex flex-wrap items-center gap-2 text-sm'>
								{isUnreviewed ? (
									<div className='flex items-center gap-1.5 font-semibold text-muted-foreground'>
										<Sparkles className='h-4 w-4' />
										<span>Unreviewed</span>
									</div>
								) : (
									<>
										<Tooltip>
											<TooltipTrigger
												render={
													<div
														className={`flex items-center gap-1.5 font-semibold ${freshnessTierColor}`}
													>
														<Brain className='h-4 w-4' />
														<span>{freshnessTierInfo.label}</span>
													</div>
												}
											/>
											<TooltipContent>
												{freshnessTierInfo.tooltip ??
													'Complete a review to see freshness tier'}
											</TooltipContent>
										</Tooltip>
										{latestCompletedReview ? (
											<>
												<span aria-hidden={true} className='font-bold'>
													·
												</span>
												<Tooltip>
													<TooltipTrigger
														render={
															<Button
																className='h-auto gap-1 p-0 font-semibold text-muted-foreground text-sm'
																onClick={() =>
																	openReviewDialog(latestCompletedReview.id)
																}
																size='default'
																variant='link'
															>
																<span>{`Reviewed ${lastReviewed.text}`}</span>
																{latestCompletedReview.rating ? (
																	<span className='flex size-4 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground dark:bg-primary'>
																		{getRatingIcon(
																			latestCompletedReview.rating
																		)}
																	</span>
																) : null}
															</Button>
														}
													/>
													<TooltipContent>
														{formatAbsoluteDate(
															latestCompletedReview.completed_at
														)}
													</TooltipContent>
												</Tooltip>
											</>
										) : null}
										<span className='font-bold'>·</span>
										<Tooltip>
											<TooltipTrigger
												render={
													<div className='flex items-center gap-1.5 font-semibold text-muted-foreground'>
														<Anvil className='h-4 w-4' />
														<span>{`${stabilityText} durability`}</span>
													</div>
												}
											/>
											<TooltipContent>
												Lasts {stabilityText} before getting hazy
											</TooltipContent>
										</Tooltip>
									</>
								)}
								<div className='ml-auto flex items-center gap-2 font-semibold text-muted-foreground text-sm'>
									<Tooltip>
										<TooltipTrigger
											render={
												<span>{`Edited ${formatRelativeDate(note.updated_at).text}`}</span>
											}
										/>
										<TooltipContent>
											{dayjs(note.updated_at).format('MMM D, YYYY')}
										</TooltipContent>
									</Tooltip>
									<span aria-hidden={true}>·</span>
									<Tooltip>
										<TooltipTrigger
											render={
												<span>{`Created ${formatRelativeDate(note.inserted_at).text}`}</span>
											}
										/>
										<TooltipContent>
											{dayjs(note.inserted_at).format('MMM D, YYYY')}
										</TooltipContent>
									</Tooltip>
								</div>
							</div>

							<div className='my-3 flex flex-wrap items-center justify-between border-y-1 py-2'>
								<div className='flex items-center gap-2'>
									<RatingDropdown
										align='end'
										onSelect={handleRatingSelect}
										trigger={
											<Button
												className='rounded-full'
												disabled={isCreatingReview}
												size='sm'
											>
												{isCreatingReview ? (
													<Loader2 className='h-4 w-4 animate-spin' />
												) : (
													<Plus className='h-4 w-4' />
												)}
												<span>Review</span>
												<ChevronDown className='h-4 w-4' />
											</Button>
										}
									/>
									<Tooltip>
										<TooltipTrigger render={<span className='inline-flex' />}>
											<Button
												aria-label={
													note.srs_enabled
														? 'Disable SRS for this item'
														: 'Enable SRS for this item'
												}
												aria-pressed={note.srs_enabled}
												className='rounded-full'
												disabled={isUpdatingNote}
												onClick={() =>
													updateNote({
														id: note.id,
														srs_enabled: !note.srs_enabled
													})
												}
												size='icon-sm'
												variant='outline'
											>
												{note.srs_enabled ? (
													<Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
												) : (
													<Star className='h-4 w-4 text-muted-foreground' />
												)}
											</Button>
										</TooltipTrigger>
										<TooltipContent>Show in review queue</TooltipContent>
									</Tooltip>
								</div>
								<div className='flex items-center gap-2'>
									{note.in_reading_list ? (
										<Tooltip>
											<TooltipTrigger render={<span className='inline-flex' />}>
												<NoteReadingStatusPopover
													align='end'
													disabled={isUpdatingNote}
													onOpenChange={setIsReadingStatusOpen}
													onProgressNoteChange={event =>
														updateNote({
															id: note.id,
															reading_notes: event.target.value
														})
													}
													onRemoveFromReadingList={() => {
														setIsReadingStatusOpen(false)
														updateNote({ id: note.id, in_reading_list: false })
													}}
													onStatusChange={nextStatus =>
														updateNote({
															id: note.id,
															reading_status: nextStatus
														})
													}
													open={isReadingStatusOpen}
													progressNote={note.reading_notes}
													sideOffset={6}
													status={note.reading_status}
													trigger={
														<Button
															aria-label={`Status: ${currentStatusOption.label}`}
															className='rounded-full'
															disabled={isUpdatingNote}
															size='icon-sm'
															variant='outline'
														>
															<CurrentStatusIcon
																className={`h-3.5 w-3.5 ${currentStatusOption.colorClassName}`}
															/>
														</Button>
													}
												/>
											</TooltipTrigger>
											<TooltipContent>Change reading status</TooltipContent>
										</Tooltip>
									) : (
										<Tooltip>
											<TooltipTrigger render={<span className='inline-flex' />}>
												<Button
													aria-label='Add to reading list'
													className='rounded-full'
													disabled={isUpdatingNote}
													onClick={addToReadingList}
													size='icon-sm'
													variant='outline'
												>
													<BookOpen className='h-4 w-4 text-muted-foreground' />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Add to reading list</TooltipContent>
										</Tooltip>
									)}
									<Tooltip>
										<TooltipTrigger render={<span className='inline-flex' />}>
											<Toggle
												aria-label={
													note.inboxed ? 'Remove from inbox' : 'Add to inbox'
												}
												className='h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors data-[state=on]:bg-muted data-[state=on]:text-foreground'
												disabled={isUpdatingNote}
												onPressedChange={() =>
													updateNote({ id: note.id, inboxed: !note.inboxed })
												}
												pressed={note.inboxed}
												size='sm'
												variant='outline'
											>
												<Inbox className='h-4 w-4' />
											</Toggle>
										</TooltipTrigger>
										<TooltipContent>Inbox</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger render={<span className='inline-flex' />}>
											<Toggle
												aria-label={note.archived ? 'Unarchive' : 'Archive'}
												className='h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors data-[state=on]:bg-muted data-[state=on]:text-foreground'
												disabled={isUpdatingNote}
												onPressedChange={() =>
													updateNote({ id: note.id, archived: !note.archived })
												}
												pressed={note.archived}
												size='sm'
												variant='outline'
											>
												<Archive className='h-4 w-4' />
											</Toggle>
										</TooltipTrigger>
										<TooltipContent>Archive</TooltipContent>
									</Tooltip>
									<DropdownMenu>
										<DropdownMenuTrigger
											render={
												<Button
													className='rounded-full'
													size='icon-sm'
													variant='outline'
												>
													<MoreHorizontal className='h-4 w-4' />
												</Button>
											}
										/>
										<DropdownMenuContent
											align='end'
											side='bottom'
											sideOffset={4}
										>
											{note.in_reading_list ? (
												<>
													<DropdownMenuLabel>Reading status</DropdownMenuLabel>
													{READING_STATUS_OPTIONS.map(option => (
														<DropdownMenuItem
															key={option.value}
															onClick={() =>
																updateNote({
																	id: note.id,
																	reading_status: option.value
																})
															}
														>
															{option.label}
														</DropdownMenuItem>
													))}
													<DropdownMenuSeparator />
												</>
											) : null}
											<DropdownMenuItem
												onClick={() => {
													if (note.in_reading_list) {
														setIsReadingStatusOpen(false)
														updateNote({
															id: note.id,
															in_reading_list: false
														})
														return
													}
													addToReadingList()
												}}
											>
												{note.in_reading_list
													? 'Remove from Read list'
													: 'Add to Read list'}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>

							{hidesSecondary && !isBodyRevealed ? (
								<Button
									className='mt-1 min-h-16 w-full justify-center rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 px-2.5 py-2 text-base text-muted-foreground hover:bg-muted/70'
									onClick={() => setIsBodyRevealed(true)}
									size='default'
									variant='outline'
								>
									Reveal
								</Button>
							) : (
								<Textarea
									className='!bg-transparent m-0 min-h-[2lh] resize-none overflow-hidden break-words rounded-none border-none p-0 text-base leading-relaxed shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
									onBlur={() => {
										if (body !== note.body) {
											updateNote({ id: note.id, body })
										}
									}}
									onChange={event => setBody(event.target.value)}
									placeholder='Write your note...'
									spellCheck={false}
									value={body}
								/>
							)}

							<DetailTabsShell
								onValueChange={handleHomeTabChange}
								tabs={tabs}
								value={activeHomeTab}
							/>
						</div>
					)}
				</div>
			</div>
			<AddNoteDialog
				defaults={addNoteDefaults}
				inheritSrsEnabled={note.srs_enabled}
				onOpenChange={handleAddNoteDialogOpenChange}
				onSuccess={handleAddNoteSuccess}
				open={isAddNoteDialogOpen}
			/>
			<SearchDialog
				addedNoteIds={searchAddAddedNoteIds}
				allowedTypes={searchAddAllowedTypes}
				closeOnSelect={false}
				customStatusBadges={searchAddCustomStatusBadges}
				initialFilter={searchAddInitialFilter}
				onOpenChange={setIsSearchAddOpen}
				onSelectEntity={handleSearchAddSelect}
				open={isSearchAddOpen}
				pendingNoteIds={
					searchAddPendingNoteId != null ? [searchAddPendingNoteId] : []
				}
				placeholder={
					searchAddMode === 'parent'
						? 'Search notes to set as parent...'
						: 'Search notes to add...'
				}
				query={searchAddQuery}
				setQuery={setSearchAddQuery}
				showAllOption={searchAddShowAllOption}
				showNoTagOption={searchAddShowNoTagOption}
				title={searchAddTitle}
			/>
		</div>
	)
}
