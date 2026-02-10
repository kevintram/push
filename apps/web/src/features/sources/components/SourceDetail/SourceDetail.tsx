import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, use, useCallback, useRef } from 'react'
import { LearnableDetailHeader } from '~/components/LearnableDetailHeader'
import { Textarea } from '~/components/ui/Textarea'
import type { Topic } from '~/features/topics/types/topic.types'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { OnConversionSuccess } from '~/hooks/useConversionNavigate'
import { useFsrsState } from '~/hooks/useFsrsState'
import { cn } from '~/lib/utils'
import { sourceKeys } from '../../api/queryKeys'
import { useUpdateSource } from '../../api/updateSource'
import { useSourceMetrics } from '../../hooks/useSourceMetrics'
import { SourceContext } from '../../stores/SelectedSourceContext'
import type { Source } from '../../types/source.types'
import { SourceActionMenu } from '../SourceActionMenu'
import { SourceChildrenPanel } from '../SourceChildrenPanel'
import { SourcePracticesPanel } from '../SourcePracticesPanel'
import { SourcePrerequisitesPanel } from '../SourcePrerequisitesPanel'
import { SourceRelatedPanel } from '../SourceRelatedPanel'
import { SourceTopicsPanel } from '../SourceTopicsPanel'
import { SourceDetailNavBar } from './SourceDetailNavBar'
import { SourceDetailSkeleton } from './SourceDetailSkeleton'

interface SourceDetailProps {
	/**
	 * The source to display. If not provided, reads from SourceContext.
	 */
	source?: Source | null
	/**
	 * Loading state. If not provided, reads from SourceContext.
	 */
	isLoading?: boolean
	/**
	 * Content to render in the left section before the parent indicator (e.g., navigation buttons).
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
	 * Callback when the source is successfully converted to another entity type.
	 */
	onConvertSuccess?: OnConversionSuccess
	/**
	 * Callback when the source is deleted.
	 */
	onDelete?: () => void | Promise<void>
	/**
	 * Callback when navigating to another source (parent/child click).
	 * If not provided, uses default dialog behavior.
	 */
	onSourceNavigate?: (sourceId: number) => void
	/**
	 * Callback when navigating to a topic (topic click in topics panel).
	 * If not provided, uses default dialog behavior.
	 */
	onTopicNavigate?: (topicId: number) => void
	/**
	 * Callback when navigating to a practice (practice click in practices panel).
	 * If not provided, uses default dialog behavior.
	 */
	onPracticeNavigate?: (practiceId: number) => void
	/**
	 * Custom card renderer for children panel.
	 */
	renderChildCard?: (
		source: Source,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
	/**
	 * Custom card renderer for topics panel.
	 */
	renderTopicCard?: (
		topic: Topic,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
	/**
	 * Optional className to apply to the scroll container
	 */
	className?: string
}

export function SourceDetail({
	source: sourceProp,
	isLoading: isLoadingProp,
	headerBeforeActions,
	headerAfterActions,
	sidebarReadonly = false,
	onConvertSuccess,
	onDelete,
	onSourceNavigate,
	onTopicNavigate,
	onPracticeNavigate,
	renderChildCard,
	renderTopicCard,
	className
}: SourceDetailProps) {
	// Get source from context if not provided via props
	const contextValue = use(SourceContext)
	const source = sourceProp !== undefined ? sourceProp : contextValue.source
	const isLoading =
		isLoadingProp !== undefined ? isLoadingProp : contextValue.isLoading

	const queryClient = useQueryClient()

	const handleSourceUpdateSuccess = useCallback(
		(updatedSource: Source) => {
			queryClient.setQueryData(
				sourceKeys.detail(updatedSource.id),
				updatedSource
			)
		},
		[queryClient]
	)

	const { mutateAsync: updateSource, isPending: isUpdatingSource } =
		useUpdateSource()

	const handleArchiveToggle = useCallback(async () => {
		if (source?.id) {
			await updateSource({
				id: source.id,
				archived: !source.archived
			})
		}
	}, [updateSource, source?.id, source?.archived])

	const handleInboxToggle = useCallback(async () => {
		if (source?.id) {
			await updateSource({
				id: source.id,
				inboxed: !source.inboxed
			})
		}
	}, [updateSource, source?.id, source?.inboxed])

	const handleSrsToggle = useCallback(
		async (pressed: boolean) => {
			if (!source?.id || sidebarReadonly) return
			await updateSource({
				id: source.id,
				srs_enabled: pressed
			})
		},
		[source?.id, sidebarReadonly, updateSource]
	)

	const metrics = useSourceMetrics(source ?? null)

	const updateNotes = useCallback(
		(newNotes: string) => {
			if (!source?.id) return
			updateSource({ id: source.id, notes: newNotes })
		},
		[updateSource, source?.id]
	)

	const updateTitle = useCallback(
		(newTitle: string) => {
			if (!source?.id) return
			updateSource({ id: source.id, title: newTitle })
		},
		[updateSource, source?.id]
	)

	const { value: notes, onChange: onNotesChange } = useAutoSave({
		initialValue: source?.notes ?? '',
		onSave: updateNotes,
		key: `sources-${source?.id}`
	})

	const { value: title, onChange: onTitleChange } = useAutoSave({
		initialValue: source?.title ?? '',
		onSave: updateTitle,
		key: `sources-${source?.id}`
	})

	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollContainerRef.current, [])

	const srsSource = useFsrsState(source)

	if (isLoading || !source) {
		return <SourceDetailSkeleton />
	}

	return (
		<div className='flex h-full min-h-0 flex-col'>
			<SourceDetailNavBar
				afterActions={headerAfterActions}
				headerBeforeActions={headerBeforeActions}
				onParentSelect={onSourceNavigate}
				source={source}
			/>
			<div className='flex min-h-0 flex-1'>
				<div
					className='scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll'
					ref={scrollContainerRef}
				>
					<div className={cn('w-full px-6 pt-2 pb-4', className)}>
						<LearnableDetailHeader
							archived={source.archived}
							createdAt={source.inserted_at}
							entityId={source.id}
							entityLabel='Source'
							entityType='source'
							inboxed={source.inboxed}
							isUpdating={isUpdatingSource}
							metrics={metrics}
							onArchiveToggle={handleArchiveToggle}
							onInboxToggle={handleInboxToggle}
							onSrsToggle={handleSrsToggle}
							onTitleChange={onTitleChange}
							readonly={sidebarReadonly}
							renderActionMenu={trigger => (
								<SourceActionMenu
									hideInboxArchive={true}
									onConvertSuccess={onConvertSuccess}
									onDelete={onDelete}
									onSourceUpdateSuccess={handleSourceUpdateSuccess}
									source={source}
									trigger={trigger}
								/>
							)}
							srsEnabled={source.srs_enabled}
							title={title}
							updatedAt={source.updated_at}
						/>
						<Textarea
							className='!bg-transparent m-0 w-full resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
							name='notes'
							onChange={onNotesChange}
							placeholder='Notes'
							value={notes}
						/>
						<div className='mt-4'>
							<SourceChildrenPanel
								children={source.children}
								getScrollElement={getScrollElement}
								inheritFsrsState={srsSource}
								onChildSelect={onSourceNavigate}
								renderCard={renderChildCard}
								sourceId={source.id}
							/>
						</div>
						<div className='mt-4'>
							<SourceTopicsPanel
								getScrollElement={getScrollElement}
								inheritFsrsState={srsSource}
								onTopicSelect={onTopicNavigate}
								renderCard={renderTopicCard}
								sourceId={source.id}
								topics={source.topics}
							/>
						</div>
						<div className='mt-4'>
							<SourcePracticesPanel
								getScrollElement={getScrollElement}
								inheritFsrsState={srsSource}
								onPracticeSelect={onPracticeNavigate}
								practices={source.practices}
								sourceId={source.id}
							/>
						</div>
						<div className='mt-4'>
							<SourcePrerequisitesPanel
								getScrollElement={getScrollElement}
								inheritFsrsState={srsSource}
								onSourceNavigate={onSourceNavigate}
								onTopicNavigate={onTopicNavigate}
								sourceId={source.id}
							/>
						</div>
						<div className='mt-4'>
							<SourceRelatedPanel
								getScrollElement={getScrollElement}
								inheritFsrsState={srsSource}
								onSourceNavigate={onSourceNavigate}
								onTopicNavigate={onTopicNavigate}
								relatedIncoming={source.related_incoming}
								relatedOutgoing={source.related_outgoing}
								sourceId={source.id}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
