import { useNavigate } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { type ChangeEventHandler, useCallback, useState } from 'react'
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
import type { ReviewCard as ReviewCardModel } from '~/features/review-cards/types/review-card.types'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import { useAutoSave } from '~/hooks/useAutoSave'
import type {
	TopicDetailReviewCardControlsVariant,
	TopicDetailReviewCardFilter
} from './shared'
import { TopicDetailNestedSectionView } from './TopicDetailNestedSectionView'
import { getTopicDetailSectionDisplayLevel } from './topicDetailLayout'
import type { TopicDetailSectionNode } from './topicDetailStructure'
import {
	getTopicDetailLabel,
	getTopicDetailSectionId
} from './topicDetailStructure'
import { getTopicDetailSectionPresentation } from './topicDetailTheme'
import { useTopicDetailSectionPanels } from './useTopicDetailSectionPanels'

type TopicDetailSectionProps = {
	collapsedSections: Record<string, boolean>
	freshTopicId: number | null
	getScrollElement: () => HTMLDivElement | null
	globalFilter: TopicDetailReviewCardFilter
	onFreshTopicInteraction: (topicId: number) => void
	onOpenReviewCard: (reviewCardId: number) => void
	onPreserveSectionOffset: (topicId: number) => boolean
	onSubtopicCreated: (parentTopicId: number, createdTopicId: number) => void
	onSectionFilterChange: (
		topicId: number,
		filter: TopicDetailReviewCardFilter
	) => void
	isReviewCardsLoading: boolean
	registerSectionHeadingRef: (
		topicId: number,
		element: HTMLElement | null
	) => void
	registerSectionTitleRef: (
		topicId: number,
		element: HTMLTextAreaElement | null
	) => void
	registerSectionRef: (topicId: number, element: HTMLElement | null) => void
	reviewCardControlsVariant: TopicDetailReviewCardControlsVariant
	resolvedFilterByTopicId: Record<number, TopicDetailReviewCardFilter>
	searchFilter: TopicDetailReviewCardFilter
	section: TopicDetailSectionNode
	topicReviewCardsById: Map<number, Array<ReviewCardModel>>
	toggleSection: (sectionId: string) => void
}

export function TopicDetailSection({
	collapsedSections,
	freshTopicId,
	getScrollElement,
	globalFilter,
	onFreshTopicInteraction,
	onOpenReviewCard,
	onPreserveSectionOffset,
	onSubtopicCreated,
	onSectionFilterChange,
	isReviewCardsLoading,
	registerSectionHeadingRef,
	registerSectionTitleRef,
	registerSectionRef,
	reviewCardControlsVariant,
	resolvedFilterByTopicId,
	searchFilter,
	section,
	topicReviewCardsById,
	toggleSection
}: TopicDetailSectionProps) {
	const navigate = useNavigate()
	const { mutateAsync: updateTopicAsync } = useUpdateTopic()
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const { mutateAsync: deleteTopicAsync, isPending: isDeletingTopic } =
		useDeleteTopic()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const sectionId = getTopicDetailSectionId(section.topic.id)
	const isCollapsed = collapsedSections[sectionId] ?? false
	const isFreshTopic = freshTopicId === section.topic.id
	const resolvedSectionFilter =
		resolvedFilterByTopicId[section.topic.id] ?? globalFilter
	const displayLevel = getTopicDetailSectionDisplayLevel(section)
	const presentation = getTopicDetailSectionPresentation(displayLevel)
	const sectionLabel = getTopicDetailLabel(
		section.topic.title,
		section.topic.body
	)
	const saveTopicTitle = useCallback(
		async (title: string) => {
			if (title === section.topic.title) return

			try {
				onPreserveSectionOffset(section.topic.id)
				await updateTopicAsync({ id: section.topic.id, title })
			} catch {
				toast.error('Failed to update topic')
			}
		},
		[
			onPreserveSectionOffset,
			section.topic.id,
			section.topic.title,
			updateTopicAsync
		]
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
	const handleTitleChange: ChangeEventHandler<HTMLTextAreaElement> =
		useCallback(
			event => {
				onFreshTopicInteraction(section.topic.id)
				onTitleChange(event)
			},
			[onFreshTopicInteraction, onTitleChange, section.topic.id]
		)

	const handleCreateSubtopic = async () => {
		if (isCreatingTopic) return

		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parent_id: section.topic.id
			})
			onSubtopicCreated(section.topic.id, created.id)
		} catch {
			toast.error('Failed to create topic')
		}
	}

	const handleOpenTopic = () => {
		void navigate({
			to: '/topics/$topicId',
			params: { topicId: section.topic.id.toString() },
			search: {
				...(searchFilter === 'all' ? {} : { filter: searchFilter }),
				...(reviewCardControlsVariant === 'compact'
					? { controls: reviewCardControlsVariant }
					: {})
			}
		})
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

	const { bodyPanel, reviewCardsSection } = useTopicDetailSectionPanels({
		getScrollElement,
		onFilterChange: filter => {
			onSectionFilterChange(section.topic.id, filter)
		},
		onTopicInteraction: () => {
			onFreshTopicInteraction(section.topic.id)
		},
		onOpenReviewCard,
		reviewCardControlsVariant,
		resolvedSectionFilter,
		section,
		sectionLabel,
		isReviewCardsLoading,
		topicReviewCardsById
	})

	return (
		<section
			className='scroll-mt-24 space-y-2.5 py-0.5'
			ref={element => {
				registerSectionRef(section.topic.id, element)
			}}
		>
			<div className={presentation.sectionTopSpacingClassName}>
				<TopicDetailNestedSectionView
					bodyPanel={bodyPanel}
					contentTopSpacingClassName={presentation.contentTopSpacingClassName}
					flushTitle={flushTitle}
					headingClassName={presentation.headingClassName}
					isCollapsed={isCollapsed}
					isCreatingTopic={isCreatingTopic}
					isFreshTopic={isFreshTopic}
					onCreateSubtopic={handleCreateSubtopic}
					onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
					onOpenTopic={handleOpenTopic}
					onTitleChange={handleTitleChange}
					registerHeadingRef={element => {
						registerSectionHeadingRef(section.topic.id, element)
					}}
					registerTitleRef={element => {
						registerSectionTitleRef(section.topic.id, element)
					}}
					reviewCardsSection={reviewCardsSection}
					section={section}
					sectionId={sectionId}
					sectionLabel={sectionLabel}
					sectionNumber={section.sectionNumber}
					title={title}
					toggleSection={toggleSection}
				/>
				{isCollapsed ? null : section.children.length > 0 ? (
					<div>
						{section.children.map(childSection => (
							<TopicDetailSection
								collapsedSections={collapsedSections}
								freshTopicId={freshTopicId}
								getScrollElement={getScrollElement}
								globalFilter={globalFilter}
								isReviewCardsLoading={isReviewCardsLoading}
								key={childSection.topic.id}
								onFreshTopicInteraction={onFreshTopicInteraction}
								onOpenReviewCard={onOpenReviewCard}
								onPreserveSectionOffset={onPreserveSectionOffset}
								onSectionFilterChange={onSectionFilterChange}
								onSubtopicCreated={onSubtopicCreated}
								registerSectionHeadingRef={registerSectionHeadingRef}
								registerSectionRef={registerSectionRef}
								registerSectionTitleRef={registerSectionTitleRef}
								resolvedFilterByTopicId={resolvedFilterByTopicId}
								reviewCardControlsVariant={reviewCardControlsVariant}
								searchFilter={searchFilter}
								section={childSection}
								toggleSection={toggleSection}
								topicReviewCardsById={topicReviewCardsById}
							/>
						))}
					</div>
				) : null}
			</div>
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
		</section>
	)
}
