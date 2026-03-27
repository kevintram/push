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
import { cn } from '~/lib/utils'
import { useReviewMode } from '~/stores/ReviewModeContext'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import type {
	TopicDetailReviewCardControlsVariant,
	TopicDetailReviewCardFilter
} from './shared'
import { TopicDetailBodyEditor } from './TopicDetailBodyEditor'
import { TopicDetailHeader } from './TopicDetailHeader'
import { TopicDetailNestedSectionView } from './TopicDetailNestedSectionView'
import { TopicDetailReviewCardsSection } from './TopicDetailReviewCardsSection'
import type { TopicDetailSectionNode } from './topicDetailStructure'
import {
	getTopicDetailLabel,
	getTopicDetailSectionId
} from './topicDetailStructure'

type TopicDetailSectionProps = {
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
	registerSectionHeadingRef: (
		topicId: number,
		element: HTMLElement | null
	) => void
	registerSectionRef: (topicId: number, element: HTMLElement | null) => void
	reviewCardControlsVariant: TopicDetailReviewCardControlsVariant
	resolvedFilterByTopicId: Record<number, TopicDetailReviewCardFilter>
	rootTopicId: number
	searchFilter: TopicDetailReviewCardFilter
	section: TopicDetailSectionNode
	shouldAutoFocusRootTitle?: boolean
	topicPath?: Array<{
		id: number
		title: string
		body: string
	}>
	topicReviewCardsById: Map<number, Array<ReviewCardModel>>
	toggleSection: (sectionId: string) => void
	renderRootContentOnly?: boolean
	rootContentClassName?: string
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
	if (displayLevel === 1) {
		return 'text-[1.625rem] font-semibold leading-[1.14] tracking-[-0.022em] sm:text-[1.75rem]'
	}
	if (displayLevel === 2) {
		return 'text-[1.375rem] font-semibold leading-[1.18] tracking-[-0.018em] sm:text-[1.5rem]'
	}
	if (displayLevel === 3) {
		return 'text-[1.125rem] font-semibold leading-[1.24] tracking-[-0.012em] sm:text-[1.1875rem]'
	}
	if (displayLevel === 4) {
		return 'text-base font-semibold leading-[1.3] tracking-[-0.008em] sm:text-[1.0625rem]'
	}
	if (displayLevel === 5) {
		return 'text-[0.9375rem] font-semibold leading-[1.34] tracking-[0.008em] text-foreground/90'
	}
	return 'text-[0.875rem] font-semibold leading-[1.4] tracking-[0.012em] text-muted-foreground'
}

function getSectionTopSpacingClassName(displayLevel: number) {
	if (displayLevel === 1) return 'pt-12'
	if (displayLevel === 2) return 'pt-10'
	if (displayLevel === 3) return 'pt-8'
	if (displayLevel === 4) return 'pt-6'
	if (displayLevel === 5) return 'pt-4'
	return 'pt-3'
}

function getSectionDisplayLevel(section: TopicDetailSectionNode) {
	return Math.min(Math.max(section.headingLevel - 1, 1), 6)
}

function filterReviewCards(
	reviewCards: Array<ReviewCardModel>,
	filter: TopicDetailReviewCardFilter
) {
	if (filter === 'all') return reviewCards

	return reviewCards.filter(reviewCard => reviewCard.type === filter)
}

export function TopicDetailSection({
	collapsedSections,
	getScrollElement,
	globalFilter,
	onGlobalFilterChange,
	onOpenRootDeleteDialog,
	onOpenReviewCard,
	onSectionFilterChange,
	registerSectionHeadingRef,
	registerSectionRef,
	reviewCardControlsVariant,
	resolvedFilterByTopicId,
	rootTopicId,
	searchFilter,
	section,
	shouldAutoFocusRootTitle = false,
	topicReviewCardsById,
	topicPath = [],
	toggleSection,
	renderRootContentOnly = false,
	rootContentClassName
}: TopicDetailSectionProps) {
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
	const sectionId = getTopicDetailSectionId(section.topic.id)
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
	const sectionTopSpacingClassName = getSectionTopSpacingClassName(displayLevel)
	const sectionLabel = getTopicDetailLabel(
		section.topic.title,
		section.topic.body
	)
	const shouldRenderRootHeader = !(isRootSection && renderRootContentOnly)
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
			toast.error('Failed to create topic')
		}
	}

	const handleOpenTopic = () => {
		navigate({
			to: '/topics/$topicId',
			params: { topicId: section.topic.id.toString() },
			search: {
				...(searchFilter === 'all' ? {} : { filter: searchFilter }),
				...(reviewCardControlsVariant === 'compact'
					? { controls: reviewCardControlsVariant }
					: {})
			}
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
		<TopicDetailBodyEditor
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
		<TopicDetailReviewCardsSection
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
			reviewCardControlsVariant={reviewCardControlsVariant}
			sectionLabel={sectionLabel}
		/>
	)

	return (
		<section
			className={cn(
				'scroll-mt-24 space-y-2.5 py-0.5',
				isRootSection && renderRootContentOnly && 'space-y-0'
			)}
			id={sectionId}
			ref={element => {
				registerSectionRef(section.topic.id, element)
			}}
		>
			<div
				className={
					isRootSection && renderRootContentOnly
						? undefined
						: sectionTopSpacingClassName
				}
			>
				{isRootSection ? (
					isCollapsed ? null : (
						<div className='grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-1.5'>
							<div aria-hidden='true' />
							<div className={cn('min-w-0', rootContentClassName)}>
								{shouldRenderRootHeader ? (
									<div
										className='scroll-mt-24'
										data-topic-detail-heading-id={section.topic.id}
										ref={element => {
											registerSectionHeadingRef(section.topic.id, element)
										}}
									>
										<TopicDetailHeader
											onOpenDeleteDialog={() => {
												onOpenRootDeleteDialog?.()
											}}
											shouldAutoFocusTitle={shouldAutoFocusRootTitle}
											topic={section.topic}
											topicPath={topicPath}
										/>
									</div>
								) : null}
								<div className={shouldRenderRootHeader ? 'pt-3' : undefined}>
									{bodyPanel}
								</div>
								<div>{reviewCardsSection}</div>
							</div>
						</div>
					)
				) : (
					<TopicDetailNestedSectionView
						bodyPanel={bodyPanel}
						createdDate={createdDate}
						createdText={created.text}
						displayLevel={displayLevel}
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
						registerHeadingRef={element => {
							registerSectionHeadingRef(section.topic.id, element)
						}}
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
					<div>
						{section.children.map(childSection => (
							<TopicDetailSection
								collapsedSections={collapsedSections}
								getScrollElement={getScrollElement}
								globalFilter={globalFilter}
								key={childSection.topic.id}
								onGlobalFilterChange={onGlobalFilterChange}
								onOpenReviewCard={onOpenReviewCard}
								onSectionFilterChange={onSectionFilterChange}
								registerSectionHeadingRef={registerSectionHeadingRef}
								registerSectionRef={registerSectionRef}
								renderRootContentOnly={renderRootContentOnly}
								resolvedFilterByTopicId={resolvedFilterByTopicId}
								reviewCardControlsVariant={reviewCardControlsVariant}
								rootContentClassName={rootContentClassName}
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
