import { useQueryClient } from '@tanstack/react-query'
import {
	type ReactElement,
	type ReactNode,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react'
import { ConversionConfirmationDialog } from '~/components/ConversionConfirmationDialog'
import { DetailTabsShell } from '~/components/DetailTabs'
import { LearnableDetailHeader } from '~/components/LearnableDetailHeader'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Textarea } from '~/components/ui/textarea'
import { useConvertSourceToPractice } from '~/features/sources/api/convertSourceToPractice'
import { useConvertSourceToTopic } from '~/features/sources/api/convertSourceToTopic'
import type { Topic } from '~/features/topics/types/topic.types'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { OnConversionSuccess } from '~/hooks/useConversionNavigate'
import { useFsrsState } from '~/hooks/useFsrsState'
import { cn } from '~/lib/utils'
import { ConversionError } from '~/utils/ConversionError'
import {
	getSourceToPracticePreview,
	getSourceToTopicPreview
} from '~/utils/conversionPreview'
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

interface SourceTypeChangeMenuProps {
	source: Source
	onConvertSuccess?: OnConversionSuccess
	trigger: ReactElement
}

function SourceTypeChangeMenu({
	source,
	onConvertSuccess,
	trigger
}: SourceTypeChangeMenuProps) {
	const [convertToTopicOpen, setConvertToTopicOpen] = useState(false)
	const [convertToPracticeOpen, setConvertToPracticeOpen] = useState(false)
	const [convertToTopicError, setConvertToTopicError] = useState<string | null>(
		null
	)
	const [convertToPracticeError, setConvertToPracticeError] = useState<
		string | null
	>(null)
	const convertToTopicMutation = useConvertSourceToTopic()
	const convertToPracticeMutation = useConvertSourceToPractice()

	const toTopicPreview = useMemo(
		() => getSourceToTopicPreview(source),
		[source]
	)
	const toPracticePreview = useMemo(
		() => getSourceToPracticePreview(source),
		[source]
	)

	const handleConfirmConvertToTopic = useCallback(async () => {
		try {
			const result = await convertToTopicMutation.mutateAsync({
				sourceId: source.id
			})
			setConvertToTopicOpen(false)
			onConvertSuccess?.('topic', result.topic_id)
		} catch (error) {
			if (error instanceof ConversionError) {
				setConvertToTopicError(error.message)
			} else {
				setConvertToTopicError('Failed to convert source to topic')
			}
		}
	}, [convertToTopicMutation, source.id, onConvertSuccess])

	const handleConfirmConvertToPractice = useCallback(async () => {
		try {
			const result = await convertToPracticeMutation.mutateAsync({
				sourceId: source.id
			})
			setConvertToPracticeOpen(false)
			onConvertSuccess?.('practice', result.practice_id)
		} catch (error) {
			if (error instanceof ConversionError) {
				setConvertToPracticeError(error.message)
			} else {
				setConvertToPracticeError('Failed to convert source to practice')
			}
		}
	}, [convertToPracticeMutation, source.id, onConvertSuccess])

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger render={trigger} />
				<DropdownMenuContent align='start' side='bottom' sideOffset={4}>
					<DropdownMenuLabel>Change type</DropdownMenuLabel>
					<DropdownMenuItem onClick={() => setConvertToTopicOpen(true)}>
						Topic
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setConvertToPracticeOpen(true)}>
						Practice
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<ConversionConfirmationDialog
				blockers={toTopicPreview.blockers}
				entityName={source.title}
				error={convertToTopicError}
				isPending={convertToTopicMutation.isPending}
				lost={toTopicPreview.lost}
				migrated={toTopicPreview.migrated}
				onConfirm={handleConfirmConvertToTopic}
				onOpenChange={open => {
					setConvertToTopicOpen(open)
					if (!open) setConvertToTopicError(null)
				}}
				open={convertToTopicOpen}
				targetEntityType='Topic'
			/>

			<ConversionConfirmationDialog
				blockers={toPracticePreview.blockers}
				entityName={source.title}
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

export type SourceDetailTab =
	| 'children'
	| 'practice'
	| 'topics'
	| 'prerequisites'
	| 'related'

const DEFAULT_SOURCE_DETAIL_TAB: SourceDetailTab = 'children'

function isSourceDetailTab(value: string): value is SourceDetailTab {
	return (
		value === 'children' ||
		value === 'practice' ||
		value === 'topics' ||
		value === 'prerequisites' ||
		value === 'related'
	)
}

function buildRequestedSourceTabs(
	activeTab: SourceDetailTab
): Record<SourceDetailTab, boolean> {
	return {
		children: activeTab === 'children',
		practice: activeTab === 'practice',
		topics: activeTab === 'topics',
		prerequisites: activeTab === 'prerequisites',
		related: activeTab === 'related'
	}
}

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
	/**
	 * Controlled active tab. Defaults to internal state when omitted.
	 */
	activeTab?: SourceDetailTab
	/**
	 * Called when tab selection changes.
	 */
	onTabChange?: (tab: SourceDetailTab) => void
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
	className,
	activeTab: activeTabProp,
	onTabChange
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
	const isTabControlled = activeTabProp !== undefined
	const [uncontrolledActiveTab, setUncontrolledActiveTab] =
		useState<SourceDetailTab>(DEFAULT_SOURCE_DETAIL_TAB)
	const activeTab = activeTabProp ?? uncontrolledActiveTab
	const [requestedTabs, setRequestedTabs] = useState<
		Record<SourceDetailTab, boolean>
	>(() => buildRequestedSourceTabs(activeTab))
	const [relatedCount, setRelatedCount] = useState<number | null>(null)
	const handleTabChange = useCallback(
		(value: string) => {
			if (!isSourceDetailTab(value)) {
				return
			}
			if (!isTabControlled) {
				setUncontrolledActiveTab(value)
			}
			onTabChange?.(value)
			setRequestedTabs(previous => {
				if (previous[value]) return previous
				return { ...previous, [value]: true }
			})
		},
		[isTabControlled, onTabChange]
	)
	useEffect(() => {
		const initialTab = isTabControlled
			? (activeTabProp ?? DEFAULT_SOURCE_DETAIL_TAB)
			: DEFAULT_SOURCE_DETAIL_TAB
		if (!isTabControlled) {
			setUncontrolledActiveTab(DEFAULT_SOURCE_DETAIL_TAB)
		}
		setRequestedTabs(buildRequestedSourceTabs(initialTab))
	}, [source?.id, isTabControlled, activeTabProp])
	useEffect(() => {
		setRelatedCount(null)
	}, [source?.id])
	useEffect(() => {
		setRequestedTabs(previous => {
			if (previous[activeTab]) return previous
			return { ...previous, [activeTab]: true }
		})
	}, [activeTab])
	const displayedRelatedCount =
		relatedCount ??
		(source?.related_incoming_count ?? 0) +
			(source?.related_outgoing_count ?? 0)

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
							renderTypeChangeMenu={trigger => (
								<SourceTypeChangeMenu
									onConvertSuccess={onConvertSuccess}
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
						<div className='mt-6'>
							<DetailTabsShell
								defaultValue='children'
								onValueChange={handleTabChange}
								tabs={[
									{
										value: 'children',
										label: 'Children',
										count: source.children_count ?? 0,
										content: requestedTabs.children ? (
											<SourceChildrenPanel
												getScrollElement={getScrollElement}
												inheritFsrsState={srsSource}
												onChildSelect={onSourceNavigate}
												renderCard={renderChildCard}
												sourceId={source.id}
											/>
										) : null
									},
									{
										value: 'practice',
										label: 'Practice',
										count: source.practices_count ?? 0,
										content: requestedTabs.practice ? (
											<SourcePracticesPanel
												getScrollElement={getScrollElement}
												inheritFsrsState={srsSource}
												onPracticeSelect={onPracticeNavigate}
												sourceId={source.id}
											/>
										) : null
									},
									{
										value: 'topics',
										label: 'Topics covered',
										count: source.topics_count ?? 0,
										content: requestedTabs.topics ? (
											<SourceTopicsPanel
												getScrollElement={getScrollElement}
												inheritFsrsState={srsSource}
												onTopicSelect={onTopicNavigate}
												renderCard={renderTopicCard}
												sourceId={source.id}
											/>
										) : null
									},
									{
										value: 'prerequisites',
										label: 'Prerequisites',
										count: source.prerequisites_count ?? 0,
										content: requestedTabs.prerequisites ? (
											<SourcePrerequisitesPanel
												getScrollElement={getScrollElement}
												inheritFsrsState={srsSource}
												onSourceNavigate={onSourceNavigate}
												onTopicNavigate={onTopicNavigate}
												sourceId={source.id}
											/>
										) : null
									},
									{
										value: 'related',
										label: 'See also',
										count: displayedRelatedCount,
										content: requestedTabs.related ? (
											<SourceRelatedPanel
												getScrollElement={getScrollElement}
												inheritFsrsState={srsSource}
												onCountChange={setRelatedCount}
												onSourceNavigate={onSourceNavigate}
												onTopicNavigate={onTopicNavigate}
												sourceId={source.id}
											/>
										) : null
									}
								]}
								value={activeTab}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
