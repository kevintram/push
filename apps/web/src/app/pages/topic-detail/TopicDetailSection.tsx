import { useNavigate } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
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
import type { TopicPathItem } from './TopicDetailBreadcrumb'
import { TopicDetailNestedSectionView } from './TopicDetailNestedSectionView'
import {
	getTopicDetailSectionDisplayLevel,
	getTopicDetailSectionPresentation
} from './topicDetailLayout'
import type { TopicDetailSectionNode } from './topicDetailStructure'
import {
	getTopicDetailLabel,
	getTopicDetailSectionId
} from './topicDetailStructure'
import { useTopicDetailSectionPanels } from './useTopicDetailSectionPanels'

type TopicDetailSectionProps = {
	collapsedSections: Record<string, boolean>
	getScrollElement: () => HTMLDivElement | null
	globalFilter: TopicDetailReviewCardFilter
	onOpenReviewCard: (reviewCardId: number) => void
	onSectionFilterChange: (
		topicId: number,
		filter: TopicDetailReviewCardFilter
	) => void
	isReviewCardsLoading: boolean
	registerSectionHeadingRef: (
		topicId: number,
		element: HTMLElement | null
	) => void
	registerSectionRef: (topicId: number, element: HTMLElement | null) => void
	reviewCardControlsVariant: TopicDetailReviewCardControlsVariant
	rootTopicPath: Array<TopicPathItem>
	resolvedFilterByTopicId: Record<number, TopicDetailReviewCardFilter>
	searchFilter: TopicDetailReviewCardFilter
	section: TopicDetailSectionNode
	topicReviewCardsById: Map<number, Array<ReviewCardModel>>
	toggleSection: (sectionId: string) => void
}

export function TopicDetailSection({
	collapsedSections,
	getScrollElement,
	globalFilter,
	onOpenReviewCard,
	onSectionFilterChange,
	isReviewCardsLoading,
	registerSectionHeadingRef,
	registerSectionRef,
	reviewCardControlsVariant,
	rootTopicPath,
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
	const resolvedSectionFilter =
		resolvedFilterByTopicId[section.topic.id] ?? globalFilter
	const displayLevel = getTopicDetailSectionDisplayLevel(section)
	const presentation = getTopicDetailSectionPresentation(displayLevel)
	const sectionLabel = getTopicDetailLabel(
		section.topic.title,
		section.topic.body
	)
	const rootTopicId = section.topicPath[0]?.id ?? section.topic.id
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

	const {
		value: title,
		onChange: onTitleChange,
		flush: flushTitle
	} = useAutoSave({
		initialValue: section.topic.title,
		onSave: saveTopicTitle,
		key: `topic-document-title-${section.topic.id}`
	})

	const handleCreateSubtopic = async () => {
		if (isCreatingTopic) return

		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parent_id: section.topic.id
			})
			await navigate({
				to: '/topics/$topicId',
				params: { topicId: created.id.toString() },
				search: { focusTitle: true }
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

	const { bodyPanel, reviewCardsSection } = useTopicDetailSectionPanels({
		getScrollElement,
		onFilterChange: filter => {
			onSectionFilterChange(section.topic.id, filter)
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
					flushTitle={flushTitle}
					headingClassName={presentation.headingClassName}
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
					rootTopicId={rootTopicId}
					rootTopicPath={rootTopicPath}
					section={section}
					sectionId={sectionId}
					sectionLabel={sectionLabel}
					title={title}
					toggleSection={toggleSection}
					topicPath={section.topicPath}
				/>
				{isCollapsed ? null : section.children.length > 0 ? (
					<div>
						{section.children.map(childSection => (
							<TopicDetailSection
								collapsedSections={collapsedSections}
								getScrollElement={getScrollElement}
								globalFilter={globalFilter}
								isReviewCardsLoading={isReviewCardsLoading}
								key={childSection.topic.id}
								onOpenReviewCard={onOpenReviewCard}
								onSectionFilterChange={onSectionFilterChange}
								registerSectionHeadingRef={registerSectionHeadingRef}
								registerSectionRef={registerSectionRef}
								resolvedFilterByTopicId={resolvedFilterByTopicId}
								reviewCardControlsVariant={reviewCardControlsVariant}
								rootTopicPath={rootTopicPath}
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
