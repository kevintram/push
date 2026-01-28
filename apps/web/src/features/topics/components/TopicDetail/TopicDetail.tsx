import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, use, useCallback, useMemo } from 'react'
import { SidebarHolder, SidebarProvider } from '~/components/ui/Sidebar'
import { Textarea } from '~/components/ui/Textarea'
import type { Source } from '~/features/sources/types/source.types'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { cn } from '~/lib/utils'
import { topicKeys } from '../../api/queryKeys'
import { useUpdateTopic } from '../../api/updateTopic'
import { useTopicMetrics } from '../../hooks/useTopicMetrics'
import { TopicContext } from '../../stores/SelectedTopicContext'
import { RelationshipDirection, type Topic } from '../../types/topic.types'
import type { SrsSource } from '../AddTopicDialog'
import { TopicChildrenPanel } from '../TopicChildrenPanel'
import { TopicRelatedPanel } from '../TopicRelatedPanel'
import { TopicSourcesPanel } from '../TopicSourcesPanel'
import { ReviewsSidebar } from './ReviewSidebar'
import { TopicDetailHeader } from './TopicDetailHeader'
import { TopicDetailSkeleton } from './TopicDetailSkeleton'
import { TopicProperties } from './TopicProperties'
import { TopicStatus } from './TopicStatus'
import { TopicTitleSection } from './TopicTitleSection'

interface TopicDetailProps {
	/**
	 * The topic to display. If not provided, reads from TopicContext.
	 */
	topic?: Topic | null
	/**
	 * Loading state. If not provided, reads from TopicContext.
	 */
	isLoading?: boolean
	/**
	 * Content to render in the left section before the parents panel (e.g., navigation buttons).
	 */
	headerBeforeActions?: ReactNode
	/**
	 * Content to render on the right side of the header (e.g., close/minimize buttons).
	 */
	headerAfterActions?: ReactNode
	/**
	 * Whether the sidebar should be readonly. Defaults to false.
	 */
	sidebarReadonly?: boolean
	/**
	 * Callback when the topic is deleted.
	 */
	onDelete?: () => void | Promise<void>
	/**
	 * Callback when navigating to another topic (parent/child click).
	 * If not provided, uses default dialog behavior.
	 */
	onTopicNavigate?: (topicId: number) => void
	/**
	 * Callback when navigating to a source (source click in sources panel).
	 * If not provided, uses default dialog behavior.
	 */
	onSourceNavigate?: (sourceId: number) => void
	/**
	 * Custom card renderer for children panel.
	 */
	renderChildCard?: (
		topic: Topic,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
	/**
	 * Custom card renderer for sources panel.
	 */
	renderSourceCard?: (source: Source, onClick: () => void) => ReactNode
	/**
	 * Optional className to apply to the scroll container
	 */
	className?: string
}

export function TopicDetail({
	topic: topicProp,
	isLoading: isLoadingProp,
	headerBeforeActions,
	headerAfterActions,
	sidebarReadonly = false,
	onDelete,
	onTopicNavigate,
	onSourceNavigate,
	renderChildCard,
	renderSourceCard,
	className
}: TopicDetailProps) {
	// Get topic from context if not provided via props
	const contextValue = use(TopicContext)
	const topic = topicProp !== undefined ? topicProp : contextValue.topic
	const isLoading =
		isLoadingProp !== undefined ? isLoadingProp : contextValue.isLoading

	const queryClient = useQueryClient()

	const handleTopicUpdateSuccess = useCallback(
		(updatedTopic: Topic) => {
			queryClient.setQueryData(topicKeys.detail(updatedTopic.id), updatedTopic)
		},
		[queryClient]
	)

	const { mutateAsync: updateTopic, isPending: isUpdatingTopic } =
		useUpdateTopic()

	const handleArchiveToggle = useCallback(async () => {
		if (topic?.id) {
			await updateTopic({
				id: topic.id,
				archived: !topic.archived
			})
		}
	}, [updateTopic, topic?.id, topic?.archived])

	const handleInboxToggle = useCallback(async () => {
		if (topic?.id) {
			await updateTopic({
				id: topic.id,
				inboxed: !topic.inboxed
			})
		}
	}, [updateTopic, topic?.id, topic?.inboxed])

	const handleSrsToggle = useCallback(
		async (pressed: boolean) => {
			if (!topic?.id || sidebarReadonly) return
			await updateTopic({
				id: topic.id,
				srs_enabled: pressed
			})
		},
		[topic?.id, sidebarReadonly, updateTopic]
	)

	const metrics = useTopicMetrics(topic ?? null)

	const updateNotes = useCallback(
		(newNotes: string) => {
			if (!topic?.id) return
			updateTopic({ id: topic.id, notes: newNotes })
		},
		[updateTopic, topic?.id]
	)

	const updateName = useCallback(
		(newName: string) => {
			if (!topic?.id) return
			updateTopic({ id: topic.id, name: newName })
		},
		[updateTopic, topic?.id]
	)

	const { value: notes, onChange: onNotesChange } = useAutoSave({
		initialValue: topic?.notes ?? '',
		onSave: updateNotes,
		key: `topics-${topic?.id}`
	})

	const { value: title, onChange: onNameChange } = useAutoSave({
		initialValue: topic?.name ?? '',
		onSave: updateName,
		key: `topics-${topic?.id}`
	})

	const [scrollContainerRef] = useResizeObserver<HTMLDivElement>()

	// Create SRS source for child/related panels
	const srsSource = useMemo((): SrsSource | null => {
		if (!topic || topic.stability == null) return null
		return {
			stability: topic.stability,
			difficulty: topic.difficulty,
			state: topic.state,
			step: topic.step,
			lastReviewedAt: topic.last_reviewed_at
		}
	}, [
		topic?.stability,
		topic?.difficulty,
		topic?.state,
		topic?.step,
		topic?.last_reviewed_at
	])

	// Merge related topics from outgoing and incoming with direction metadata
	const mergedRelated = useMemo(() => {
		if (!topic) return []
		const outgoing = (topic.related_outgoing ?? []).map(t => ({
			...t,
			relationship_direction: RelationshipDirection.Outgoing
		}))
		const incoming = (topic.related_incoming ?? []).map(t => ({
			...t,
			relationship_direction: RelationshipDirection.Incoming
		}))
		return [...outgoing, ...incoming]
	}, [topic?.related_outgoing, topic?.related_incoming])

	if (isLoading || !topic) {
		return <TopicDetailSkeleton />
	}

	return (
		<SidebarProvider
			cookieName='sidebar:topic-detail'
			defaultOpen={true}
			enableKeyboardShortcut={false}
		>
			<div className='flex h-full min-h-0 flex-col'>
				<TopicDetailHeader
					afterActions={headerAfterActions}
					headerBeforeActions={headerBeforeActions}
					onParentSelect={onTopicNavigate}
					topic={topic}
				/>
				<SidebarHolder className='flex min-h-0 flex-1'>
					<div
						className={cn(
							'scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll px-6 py-4',
							className
						)}
						ref={scrollContainerRef}
					>
						<TopicStatus
							archived={topic.archived}
							inboxed={topic.inboxed}
							onArchiveToggle={handleArchiveToggle}
							onInboxToggle={handleInboxToggle}
						/>
						<TopicTitleSection
							isUpdating={isUpdatingTopic}
							onDelete={onDelete}
							onSrsToggle={handleSrsToggle}
							onTitleChange={onNameChange}
							onTopicUpdateSuccess={handleTopicUpdateSuccess}
							sidebarReadonly={sidebarReadonly}
							title={title}
							topic={topic}
						/>
						<div className='flex flex-col gap-1'>
							<TopicProperties
								insertedAt={topic.inserted_at}
								metrics={metrics}
								updatedAt={topic.updated_at}
							/>
							<Textarea
								className='!bg-transparent m-0 w-full resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
								name='notes'
								onChange={onNotesChange}
								placeholder='Notes'
								value={notes}
							/>
						</div>
						<div className='mt-4'>
							<TopicChildrenPanel
								children={topic.children}
								getScrollElement={() => scrollContainerRef.current}
								onChildSelect={onTopicNavigate}
								renderCard={renderChildCard}
								srsSource={srsSource}
								topicId={topic.id}
							/>
						</div>
						<div className='mt-4'>
							<TopicRelatedPanel
								onRelatedSelect={onTopicNavigate}
								onSourceSelect={onSourceNavigate}
								related={mergedRelated}
								srsSource={srsSource}
								topicId={topic.id}
							/>
						</div>
						<div className='mt-4'>
							<TopicSourcesPanel
								getScrollElement={() => scrollContainerRef.current}
								onSourceSelect={onSourceNavigate}
								renderCard={renderSourceCard}
								sources={topic.sources}
								topicId={topic.id}
							/>
						</div>
					</div>
					<ReviewsSidebar readonly={sidebarReadonly} />
				</SidebarHolder>
			</div>
		</SidebarProvider>
	)
}
