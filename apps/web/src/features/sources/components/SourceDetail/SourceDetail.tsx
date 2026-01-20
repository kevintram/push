import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, use, useCallback } from 'react'
import { SidebarHolder, SidebarProvider } from '~/components/ui/Sidebar'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { cn } from '~/lib/utils'
import { sourceKeys } from '../../api/queryKeys'
import { useUpdateSource } from '../../api/updateSource'
import { useSourceMetrics } from '../../hooks/useSourceMetrics'
import { SourceContext } from '../../stores/SelectedSourceContext'
import type { Source } from '../../types/source.types'
import { SourceChildrenPanel } from '../SourceChildrenPanel'
import { SourceDetailHeader } from './SourceDetailHeader'
import { SourceDetailSkeleton } from './SourceDetailSkeleton'
import { SourceProperties } from './SourceProperties'
import { SourceReviewsSidebar } from './SourceReviewsSidebar'
import { SourceStatus } from './SourceStatus'
import { SourceTitleSection } from './SourceTitleSection'

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
	 * Callback when the source is deleted.
	 */
	onDelete?: () => void | Promise<void>
	/**
	 * Callback when navigating to another source (parent/child click).
	 * If not provided, uses default dialog behavior.
	 */
	onSourceNavigate?: (sourceId: number) => void
	/**
	 * Custom card renderer for children panel.
	 */
	renderChildCard?: (
		source: Source,
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
	onDelete,
	onSourceNavigate,
	renderChildCard,
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

	const [scrollContainerRef] = useResizeObserver<HTMLDivElement>()

	if (isLoading || !source) {
		return <SourceDetailSkeleton />
	}

	return (
		<SidebarProvider
			cookieName='sidebar:source-detail'
			defaultOpen={true}
			enableKeyboardShortcut={false}
		>
			<div className='flex h-full min-h-0 flex-col'>
				<SourceDetailHeader
					afterActions={headerAfterActions}
					headerBeforeActions={headerBeforeActions}
					onParentSelect={onSourceNavigate}
					source={source}
				/>
				<SidebarHolder className='flex min-h-0 flex-1'>
					<div
						className={cn(
							'scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll px-6 py-4',
							className
						)}
						ref={scrollContainerRef}
					>
						<SourceStatus
							archived={source.archived}
							inboxed={source.inboxed}
							onArchiveToggle={handleArchiveToggle}
							onInboxToggle={handleInboxToggle}
						/>
						<SourceTitleSection
							isUpdating={isUpdatingSource}
							onDelete={onDelete}
							onSourceUpdateSuccess={handleSourceUpdateSuccess}
							onSrsToggle={handleSrsToggle}
							onTitleChange={onTitleChange}
							sidebarReadonly={sidebarReadonly}
							source={source}
							title={title}
						/>
						<div className='flex flex-col gap-1'>
							<SourceProperties
								insertedAt={source.inserted_at}
								metrics={metrics}
								updatedAt={source.updated_at}
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
							<SourceChildrenPanel
								children={source.children}
								getScrollElement={() => scrollContainerRef.current}
								onChildSelect={onSourceNavigate}
								renderCard={renderChildCard}
								sourceId={source.id}
							/>
						</div>
					</div>
					<SourceReviewsSidebar readonly={sidebarReadonly} />
				</SidebarHolder>
			</div>
		</SidebarProvider>
	)
}
