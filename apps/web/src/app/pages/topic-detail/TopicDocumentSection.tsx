import { useNavigate } from '@tanstack/react-router'
import {
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Heading5,
	Heading6,
	Trash2
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { useCreateReviewCard } from '~/features/review-cards/api/createReviewCard'
import { requestFocusNewReviewCardPrompt } from '~/features/review-cards/createReviewCardIntent'
import type {
	ReviewCard as ReviewCardModel,
	ReviewCardType
} from '~/features/review-cards/types/review-card.types'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import { requestFocusNewTopicTitle } from '~/features/topics/createTopicIntent'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useRevealPanel } from '~/hooks/useRevealPanel'
import { useReviewMode } from '~/stores/ReviewModeContext'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import type { TopicDetailReviewCardFilter } from './shared'
import { TopicDetailBodyPanel } from './TopicDetailBodyPanel'
import { TopicDocumentNestedSection } from './TopicDocumentNestedSection'
import { TopicDocumentPageHeader } from './TopicDocumentPageHeader'
import { TopicDocumentReviewCardsSection } from './TopicDocumentReviewCardsSection'
import type { TopicDocumentSectionNode } from './topicDocumentUtils'
import {
	getTopicDocumentLabel,
	getTopicDocumentSectionId
} from './topicDocumentUtils'

type TopicDocumentSectionProps = {
	collapsedSections: Record<string, boolean>
	getScrollElement: () => HTMLDivElement | null
	globalFilter: TopicDetailReviewCardFilter
	onGlobalFilterChange: (filter: TopicDetailReviewCardFilter) => void
	onOpenRootDeleteDialog?: () => void
	onOpenReviewCard: (reviewCardId: number) => void
	onSectionFilterChange: (
		topicId: number,
		filter: TopicDetailReviewCardFilter
	) => void
	registerSectionRef: (topicId: number, element: HTMLElement | null) => void
	resolvedFilterByTopicId: Record<number, TopicDetailReviewCardFilter>
	rootTopicId: number
	searchFilter: TopicDetailReviewCardFilter
	section: TopicDocumentSectionNode
	shouldAutoFocusRootTitle?: boolean
	topicPath?: Array<{
		id: number
		title: string
		body: string
	}>
	topicReviewCardsById: Map<number, Array<ReviewCardModel>>
	toggleSection: (sectionId: string) => void
}

const HEADING_ICON_BY_LEVEL = {
	1: Heading1,
	2: Heading2,
	3: Heading3,
	4: Heading4,
	5: Heading5,
	6: Heading6
} as const

function getHeadingClassName(displayLevel: number) {
	if (displayLevel === 1) return 'text-[1.75rem] font-semibold tracking-tight'
	if (displayLevel === 2) return 'text-2xl font-semibold tracking-tight'
	if (displayLevel === 3) return 'text-xl font-medium tracking-tight'
	if (displayLevel === 4) return 'text-lg font-medium tracking-tight'
	if (displayLevel === 5) return 'text-base font-medium'
	return 'text-sm font-medium uppercase tracking-wide text-muted-foreground'
}

function getSectionDisplayLevel(section: TopicDocumentSectionNode) {
	return Math.min(Math.max(section.headingLevel - 1, 1), 6)
}

function filterReviewCards(
	reviewCards: Array<ReviewCardModel>,
	filter: TopicDetailReviewCardFilter
) {
	if (filter === 'all') return reviewCards

	return reviewCards.filter(reviewCard => reviewCard.type === filter)
}

export function TopicDocumentSection({
	collapsedSections,
	getScrollElement,
	globalFilter,
	onGlobalFilterChange,
	onOpenRootDeleteDialog,
	onOpenReviewCard,
	onSectionFilterChange,
	registerSectionRef,
	resolvedFilterByTopicId,
	rootTopicId,
	searchFilter,
	section,
	shouldAutoFocusRootTitle = false,
	topicReviewCardsById,
	topicPath = [],
	toggleSection
}: TopicDocumentSectionProps) {
	const navigate = useNavigate()
	const { mutateAsync: updateTopicAsync } = useUpdateTopic()
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const { mutateAsync: deleteTopicAsync, isPending: isDeletingTopic } =
		useDeleteTopic()
	const {
		mutateAsync: createReviewCardAsync,
		isPending: isCreatingReviewCard
	} = useCreateReviewCard()
	const { hidesSecondary } = useReviewMode()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const sectionId = getTopicDocumentSectionId(section.topic.id)
	const isRootSection = section.topic.id === rootTopicId
	const isCollapsed = isRootSection
		? false
		: (collapsedSections[sectionId] ?? false)
	const resolvedSectionFilter =
		resolvedFilterByTopicId[section.topic.id] ?? globalFilter
	const sectionReviewCards = topicReviewCardsById.get(section.topic.id) ?? []
	const filteredReviewCards = useMemo(
		() => filterReviewCards(sectionReviewCards, resolvedSectionFilter),
		[resolvedSectionFilter, sectionReviewCards]
	)
	const displayLevel = getSectionDisplayLevel(section)
	const HeadingIcon =
		HEADING_ICON_BY_LEVEL[displayLevel as keyof typeof HEADING_ICON_BY_LEVEL]
	const headingClassName = getHeadingClassName(displayLevel)
	const sectionLabel = getTopicDocumentLabel(
		section.topic.title,
		section.topic.body
	)
	const hasReviewCards = sectionReviewCards.length > 0
	const updated = useMemo(
		() =>
			formatRelativeDate(section.topic.updated_at, {
				includeFuture: false,
				nullLabel: 'never'
			}),
		[section.topic.updated_at]
	)
	const created = useMemo(
		() =>
			formatRelativeDate(section.topic.inserted_at, {
				includeFuture: false,
				nullLabel: 'never'
			}),
		[section.topic.inserted_at]
	)
	const updatedDate = useMemo(
		() => formatAbsoluteDate(section.topic.updated_at),
		[section.topic.updated_at]
	)
	const createdDate = useMemo(
		() => formatAbsoluteDate(section.topic.inserted_at),
		[section.topic.inserted_at]
	)

	const saveTopicTitle = useCallback(
		async (title: string) => {
			if (title === section.topic.title) return

			try {
				await updateTopicAsync({ id: section.topic.id, title })
			} catch {
				toast.error('Failed to update topic')
			}
		},
		[section.topic.id, section.topic.title, updateTopicAsync]
	)

	const saveTopicBody = useCallback(
		async (body: string) => {
			if (body === section.topic.body) return

			try {
				await updateTopicAsync({ id: section.topic.id, body })
			} catch {
				toast.error('Failed to update topic')
			}
		},
		[section.topic.body, section.topic.id, updateTopicAsync]
	)

	const {
		value: title,
		onChange: onTitleChange,
		flush: flushTitle
	} = useAutoSave({
		initialValue: section.topic.title,
		onSave: saveTopicTitle,
		key: `topic-document-title-${section.topic.id}`
	})
	const {
		value: body,
		onChange: onBodyChange,
		setValue: setBody,
		flush: flushBody
	} = useAutoSave({
		initialValue: section.topic.body,
		onSave: saveTopicBody,
		key: `topic-document-body-${section.topic.id}`
	})
	const isBodyEmpty = body.trim().length === 0
	const {
		revealPanelTab,
		setRevealPanelTab,
		guessText: guessBodyText,
		setGuessText: setGuessBodyText,
		isCopied: isRevealPanelCopied,
		handleCopyGuessText,
		handleCopyRevealText
	} = useRevealPanel({
		revealText: body,
		entityId: section.topic.id,
		hidesSecondary,
		defaultTab: hidesSecondary ? null : 'reveal'
	})

	const handleAddReviewCard = async (type: ReviewCardType) => {
		try {
			const created = await createReviewCardAsync({
				topic_id: section.topic.id,
				type,
				prompt: '',
				answer: '',
				retired: false
			})
			requestFocusNewReviewCardPrompt(created.id)
			onOpenReviewCard(created.id)
		} catch {
			toast.error('Failed to create review card')
		}
	}

	const handleCreateSubtopic = async () => {
		if (isCreatingTopic) return

		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parent_id: section.topic.id
			})
			requestFocusNewTopicTitle(created.id)
			await navigate({
				to: '/topics/$topicId',
				params: { topicId: created.id.toString() }
			})
		} catch {
			toast.error('Failed to create subtopic')
		}
	}

	const handleOpenTopic = () => {
		navigate({
			to: '/topics/$topicId',
			params: { topicId: section.topic.id.toString() },
			search: searchFilter === 'all' ? {} : { filter: searchFilter }
		}).catch(() => {})
	}

	const handleDeleteTopic = async () => {
		if (isDeletingTopic) return

		try {
			await deleteTopicAsync(section.topic.id)
			setIsDeleteDialogOpen(false)
			toast.success('Topic deleted')
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete topic'
			)
		}
	}

	const bodyPanel = (
		<TopicDetailBodyPanel
			body={body}
			flushBody={flushBody}
			guessBodyText={guessBodyText}
			handleCopyGuessText={handleCopyGuessText}
			handleCopyRevealText={handleCopyRevealText}
			hidesSecondary={hidesSecondary}
			isBodyEmpty={isBodyEmpty}
			isRevealPanelCopied={isRevealPanelCopied}
			onBodyChange={onBodyChange}
			revealPanelTab={revealPanelTab}
			setBody={setBody}
			setGuessBodyText={setGuessBodyText}
			setRevealPanelTab={setRevealPanelTab}
		/>
	)

	const reviewCardsSection = (
		<TopicDocumentReviewCardsSection
			filteredReviewCards={filteredReviewCards}
			getScrollElement={getScrollElement}
			hasReviewCards={hasReviewCards}
			hidesSecondary={hidesSecondary}
			isCreatingReviewCard={isCreatingReviewCard}
			onAddReviewCard={type => {
				handleAddReviewCard(type).catch(() => {})
			}}
			onFilterChange={filter => {
				if (isRootSection) {
					onGlobalFilterChange(filter)
					return
				}

				onSectionFilterChange(section.topic.id, filter)
			}}
			onOpenReviewCard={onOpenReviewCard}
			resolvedSectionFilter={resolvedSectionFilter}
			sectionLabel={sectionLabel}
		/>
	)

	return (
		<section
			className='scroll-mt-24 space-y-2.5 py-0.5'
			id={sectionId}
			ref={element => {
				registerSectionRef(section.topic.id, element)
			}}
		>
			<div className='space-y-3.5'>
				{isRootSection ? (
					isCollapsed ? null : (
						<div className='grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-1.5'>
							<div aria-hidden='true' />
							<div className='space-y-2'>
								<TopicDocumentPageHeader
									onOpenDeleteDialog={() => {
										onOpenRootDeleteDialog?.()
									}}
									shouldAutoFocusTitle={shouldAutoFocusRootTitle}
									topic={section.topic}
									topicPath={topicPath}
								/>
								{bodyPanel}
								<div className='space-y-2.5'>{reviewCardsSection}</div>
							</div>
						</div>
					)
				) : (
					<TopicDocumentNestedSection
						bodyPanel={bodyPanel}
						createdDate={createdDate}
						createdText={created.text}
						flushTitle={flushTitle}
						HeadingIcon={HeadingIcon}
						headingClassName={headingClassName}
						isCollapsed={isCollapsed}
						isCreatingTopic={isCreatingTopic}
						onCreateSubtopic={() => {
							handleCreateSubtopic().catch(() => {})
						}}
						onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
						onOpenTopic={handleOpenTopic}
						onTitleChange={onTitleChange}
						reviewCardsSection={reviewCardsSection}
						section={section}
						sectionId={sectionId}
						sectionLabel={sectionLabel}
						title={title}
						toggleSection={toggleSection}
						updatedDate={updatedDate}
						updatedText={updated.text}
					/>
				)}
				{isCollapsed ? null : section.children.length > 0 ? (
					<div className='space-y-6'>
						{section.children.map(childSection => (
							<TopicDocumentSection
								collapsedSections={collapsedSections}
								getScrollElement={getScrollElement}
								globalFilter={globalFilter}
								key={childSection.topic.id}
								onGlobalFilterChange={onGlobalFilterChange}
								onOpenReviewCard={onOpenReviewCard}
								onSectionFilterChange={onSectionFilterChange}
								registerSectionRef={registerSectionRef}
								resolvedFilterByTopicId={resolvedFilterByTopicId}
								rootTopicId={rootTopicId}
								searchFilter={searchFilter}
								section={childSection}
								shouldAutoFocusRootTitle={shouldAutoFocusRootTitle}
								toggleSection={toggleSection}
								topicPath={topicPath}
								topicReviewCardsById={topicReviewCardsById}
							/>
						))}
					</div>
				) : null}
			</div>
			{isRootSection ? null : (
				<AlertDialog
					onOpenChange={setIsDeleteDialogOpen}
					open={isDeleteDialogOpen}
				>
					<AlertDialogContent size='sm'>
						<AlertDialogHeader>
							<AlertDialogMedia>
								<Trash2 className='h-5 w-5' />
							</AlertDialogMedia>
							<AlertDialogTitle>Delete topic?</AlertDialogTitle>
							<AlertDialogDescription>
								{`Delete ${sectionLabel} and all of its subtopics, review cards, and reviews? This action cannot be undone.`}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel
								buttonClassName='w-full sm:w-auto'
								disabled={isDeletingTopic}
							>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								buttonClassName='w-full sm:w-auto'
								disabled={isDeletingTopic}
								onClick={() => {
									handleDeleteTopic().catch(() => {})
								}}
							>
								{isDeletingTopic ? 'Deleting...' : 'Delete topic'}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</section>
	)
}
