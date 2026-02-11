import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, use, useCallback, useMemo, useRef, useState } from 'react'
import { ConversionConfirmationDialog } from '~/components/ConversionConfirmationDialog'
import { LearnableDetailHeader } from '~/components/LearnableDetailHeader'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Textarea } from '~/components/ui/Textarea'
import type { Source } from '~/features/sources/types/source.types'
import { useConvertTopicToPractice } from '~/features/topics/api/convertTopicToPractice'
import { useConvertTopicToSource } from '~/features/topics/api/convertTopicToSource'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { OnConversionSuccess } from '~/hooks/useConversionNavigate'
import { useFsrsState } from '~/hooks/useFsrsState'
import { cn } from '~/lib/utils'
import { ConversionError } from '~/utils/ConversionError'
import {
	getTopicToPracticePreview,
	getTopicToSourcePreview
} from '~/utils/conversionPreview'
import { topicKeys } from '../../api/queryKeys'
import { useUpdateTopic } from '../../api/updateTopic'
import { useTopicMetrics } from '../../hooks/useTopicMetrics'
import { TopicContext } from '../../stores/SelectedTopicContext'
import { RelationshipDirection, type Topic } from '../../types/topic.types'
import { TopicActionMenu } from '../TopicActionMenu'
import { TopicChildrenPanel } from '../TopicChildrenPanel'
import { TopicPracticesPanel } from '../TopicPracticesPanel'
import { TopicRelatedPanel } from '../TopicRelatedPanel'
import { TopicSourcesPanel } from '../TopicSourcesPanel'
import { TopicDetailNavBar } from './TopicDetailNavBar'
import { TopicDetailSkeleton } from './TopicDetailSkeleton'

interface TopicTypeChangeMenuProps {
	topic: Topic
	onConvertSuccess?: OnConversionSuccess
	trigger: ReactNode
}

function TopicTypeChangeMenu({
	topic,
	onConvertSuccess,
	trigger
}: TopicTypeChangeMenuProps) {
	const [convertToSourceOpen, setConvertToSourceOpen] = useState(false)
	const [convertToPracticeOpen, setConvertToPracticeOpen] = useState(false)
	const [convertToSourceError, setConvertToSourceError] = useState<string | null>(
		null
	)
	const [convertToPracticeError, setConvertToPracticeError] = useState<
		string | null
	>(null)
	const convertToSourceMutation = useConvertTopicToSource()
	const convertToPracticeMutation = useConvertTopicToPractice()

	const toSourcePreview = useMemo(() => getTopicToSourcePreview(topic), [topic])
	const toPracticePreview = useMemo(
		() => getTopicToPracticePreview(topic),
		[topic]
	)

	const handleConfirmConvertToSource = useCallback(async () => {
		try {
			const result = await convertToSourceMutation.mutateAsync({
				topicId: topic.id
			})
			setConvertToSourceOpen(false)
			onConvertSuccess?.('source', result.source_id)
		} catch (error) {
			if (error instanceof ConversionError) {
				setConvertToSourceError(error.message)
			} else {
				setConvertToSourceError('Failed to convert topic to source')
			}
		}
	}, [convertToSourceMutation, topic.id, onConvertSuccess])

	const handleConfirmConvertToPractice = useCallback(async () => {
		try {
			const result = await convertToPracticeMutation.mutateAsync({
				topicId: topic.id
			})
			setConvertToPracticeOpen(false)
			onConvertSuccess?.('practice', result.practice_id)
		} catch (error) {
			if (error instanceof ConversionError) {
				setConvertToPracticeError(error.message)
			} else {
				setConvertToPracticeError('Failed to convert topic to practice')
			}
		}
	}, [convertToPracticeMutation, topic.id, onConvertSuccess])

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild={true}>{trigger}</DropdownMenuTrigger>
				<DropdownMenuContent align='start' side='bottom' sideOffset={4}>
					<DropdownMenuLabel>Change type</DropdownMenuLabel>
					<DropdownMenuItem onClick={() => setConvertToSourceOpen(true)}>
						Source
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setConvertToPracticeOpen(true)}>
						Practice
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<ConversionConfirmationDialog
				blockers={toSourcePreview.blockers}
				entityName={topic.name}
				error={convertToSourceError}
				isPending={convertToSourceMutation.isPending}
				lost={toSourcePreview.lost}
				migrated={toSourcePreview.migrated}
				onConfirm={handleConfirmConvertToSource}
				onOpenChange={open => {
					setConvertToSourceOpen(open)
					if (!open) setConvertToSourceError(null)
				}}
				open={convertToSourceOpen}
				targetEntityType='Source'
			/>

			<ConversionConfirmationDialog
				blockers={toPracticePreview.blockers}
				entityName={topic.name}
				error={convertToPracticeError}
				isPending={convertToPracticeMutation.isPending}
				lost={toPracticePreview.lost}
				migrated={toPracticePreview.migrated}
				onConfirm={handleConfirmConvertToPractice}
				onOpenChange={open => {
					setConvertToPracticeOpen(open)
					if (!open) setConvertToPracticeError(null)
				}}
				open={convertToPracticeOpen}
				targetEntityType='Practice'
			/>
		</>
	)
}

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
	 * Callback when the topic is successfully converted to another entity type.
	 */
	onConvertSuccess?: OnConversionSuccess
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
	 * Callback when navigating to a practice (practice click in practices panel).
	 * If not provided, uses default dialog behavior.
	 */
	onPracticeNavigate?: (practiceId: number) => void
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
	onConvertSuccess,
	onDelete,
	onTopicNavigate,
	onSourceNavigate,
	onPracticeNavigate,
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

	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollContainerRef.current, [])

	const srsSource = useFsrsState(topic)

	const relatedOutgoing = topic?.related_outgoing
	const relatedIncoming = topic?.related_incoming

	// Merge related topics from outgoing and incoming with direction metadata
	const mergedRelated = useMemo(() => {
		const outgoing = (relatedOutgoing ?? []).map(entity => ({
			...entity,
			relationship_direction: RelationshipDirection.Outgoing
		}))
		const incoming = (relatedIncoming ?? []).map(entity => ({
			...entity,
			relationship_direction: RelationshipDirection.Incoming
		}))
		const seen = new Set<string>()

		// Keep first occurrence (outgoing first) so each entity appears once.
		return [...outgoing, ...incoming].filter(entity => {
			const key = `${entity.entity_type}-${entity.id}`
			if (seen.has(key)) return false
			seen.add(key)
			return true
		})
	}, [relatedOutgoing, relatedIncoming])

	if (isLoading || !topic) {
		return <TopicDetailSkeleton />
	}

	return (
		<div className='flex h-full min-h-0 flex-col'>
			<TopicDetailNavBar
				afterActions={headerAfterActions}
				headerBeforeActions={headerBeforeActions}
				onParentSelect={onTopicNavigate}
				topic={topic}
			/>
			<div className='flex min-h-0 flex-1'>
				<div
					className='scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll'
					ref={scrollContainerRef}
				>
					<div className={cn('w-full px-6 pt-2 pb-4', className)}>
						<LearnableDetailHeader
							archived={topic.archived}
							createdAt={topic.inserted_at}
							entityId={topic.id}
							entityLabel='Topic'
							entityType='topic'
							inboxed={topic.inboxed}
							isUpdating={isUpdatingTopic}
							metrics={metrics}
							onArchiveToggle={handleArchiveToggle}
							onInboxToggle={handleInboxToggle}
							onSrsToggle={handleSrsToggle}
							onTitleChange={onNameChange}
							readonly={sidebarReadonly}
							renderTypeChangeMenu={trigger => (
								<TopicTypeChangeMenu
									onConvertSuccess={onConvertSuccess}
									topic={topic}
									trigger={trigger}
								/>
							)}
							renderActionMenu={trigger => (
								<TopicActionMenu
									hideInboxArchive={true}
									onConvertSuccess={onConvertSuccess}
									onDelete={onDelete}
									onTopicUpdateSuccess={handleTopicUpdateSuccess}
									topic={topic}
									trigger={trigger}
								/>
							)}
							srsEnabled={topic.srs_enabled}
							title={title}
							updatedAt={topic.updated_at}
						/>
						<Textarea
							className='!bg-transparent m-0 w-full resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
							name='notes'
							onChange={onNotesChange}
							placeholder='Notes'
							value={notes}
						/>
						<div className='mt-4'>
							<TopicChildrenPanel
								children={topic.children}
								getScrollElement={getScrollElement}
								inheritFsrsState={srsSource}
								onChildSelect={onTopicNavigate}
								renderCard={renderChildCard}
								topicId={topic.id}
							/>
						</div>
						<div className='mt-4'>
							<TopicRelatedPanel
								getScrollElement={getScrollElement}
								inheritFsrsState={srsSource}
								onRelatedSelect={onTopicNavigate}
								onSourceSelect={onSourceNavigate}
								related={mergedRelated}
								topicId={topic.id}
							/>
						</div>
						<div className='mt-4'>
							<TopicSourcesPanel
								getScrollElement={getScrollElement}
								inheritFsrsState={srsSource}
								onSourceSelect={onSourceNavigate}
								renderCard={renderSourceCard}
								sources={topic.sources}
								topicId={topic.id}
							/>
						</div>
						<div className='mt-4'>
							<TopicPracticesPanel
								getScrollElement={getScrollElement}
								inheritFsrsState={srsSource}
								onPracticeSelect={onPracticeNavigate}
								practices={topic.practices}
								topicId={topic.id}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
