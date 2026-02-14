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
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Textarea } from '~/components/ui/textarea'
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
import type { Topic } from '../../types/topic.types'
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
	trigger: ReactElement
}

function TopicTypeChangeMenu({
	topic,
	onConvertSuccess,
	trigger
}: TopicTypeChangeMenuProps) {
	const [convertToSourceOpen, setConvertToSourceOpen] = useState(false)
	const [convertToPracticeOpen, setConvertToPracticeOpen] = useState(false)
	const [convertToSourceError, setConvertToSourceError] = useState<
		string | null
	>(null)
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
				<DropdownMenuTrigger render={trigger} />
				<DropdownMenuContent align='start' side='bottom' sideOffset={4}>
					<DropdownMenuGroup>
						<DropdownMenuLabel>Change type</DropdownMenuLabel>
						<DropdownMenuItem onClick={() => setConvertToSourceOpen(true)}>
							Source
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setConvertToPracticeOpen(true)}>
							Practice
						</DropdownMenuItem>
					</DropdownMenuGroup>
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

export type TopicDetailTab = 'children' | 'practice' | 'sources' | 'related'

const DEFAULT_TOPIC_DETAIL_TAB: TopicDetailTab = 'children'

function isTopicDetailTab(value: string): value is TopicDetailTab {
	return (
		value === 'children' ||
		value === 'practice' ||
		value === 'sources' ||
		value === 'related'
	)
}

function buildRequestedTopicTabs(
	activeTab: TopicDetailTab
): Record<TopicDetailTab, boolean> {
	return {
		children: activeTab === 'children',
		practice: activeTab === 'practice',
		sources: activeTab === 'sources',
		related: activeTab === 'related'
	}
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
	/**
	 * Controlled active tab. Defaults to internal state when omitted.
	 */
	activeTab?: TopicDetailTab
	/**
	 * Called when tab selection changes.
	 */
	onTabChange?: (tab: TopicDetailTab) => void
}

export function TopicDetail({
	topic: topicProp,
	isLoading: isLoadingProp,
	headerAfterActions,
	sidebarReadonly = false,
	onConvertSuccess,
	onDelete,
	onTopicNavigate,
	onSourceNavigate,
	onPracticeNavigate,
	renderChildCard,
	renderSourceCard,
	className,
	activeTab: activeTabProp,
	onTabChange
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
	const isTabControlled = activeTabProp !== undefined
	const [uncontrolledActiveTab, setUncontrolledActiveTab] =
		useState<TopicDetailTab>(DEFAULT_TOPIC_DETAIL_TAB)
	const activeTab = activeTabProp ?? uncontrolledActiveTab
	const [requestedTabs, setRequestedTabs] = useState<
		Record<TopicDetailTab, boolean>
	>(() => buildRequestedTopicTabs(activeTab))
	const [relatedCount, setRelatedCount] = useState<number | null>(null)
	const handleTabChange = useCallback(
		(value: string) => {
			if (!isTopicDetailTab(value)) {
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
			? (activeTabProp ?? DEFAULT_TOPIC_DETAIL_TAB)
			: DEFAULT_TOPIC_DETAIL_TAB
		if (!isTabControlled) {
			setUncontrolledActiveTab(DEFAULT_TOPIC_DETAIL_TAB)
		}
		setRequestedTabs(buildRequestedTopicTabs(initialTab))
	}, [topic?.id, isTabControlled, activeTabProp])
	useEffect(() => {
		setRelatedCount(null)
	}, [topic?.id])
	useEffect(() => {
		setRequestedTabs(previous => {
			if (previous[activeTab]) return previous
			return { ...previous, [activeTab]: true }
		})
	}, [activeTab])
	const displayedRelatedCount =
		relatedCount ??
		(topic?.related_outgoing_count ?? 0) + (topic?.related_incoming_count ?? 0)

	const srsSource = useFsrsState(topic)

	if (isLoading || !topic) {
		return <TopicDetailSkeleton />
	}

	return (
		<div className='flex h-full min-h-0 flex-col'>
			<TopicDetailNavBar
				afterActions={headerAfterActions}
				onParentSelect={onTopicNavigate}
				topic={topic}
			/>
			<div className='flex min-h-0 flex-1'>
				<div
					className='scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll'
					ref={scrollContainerRef}
				>
					<div className={cn('w-full px-6 pt-6 pb-4', className)}>
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
							renderTypeChangeMenu={trigger => (
								<TopicTypeChangeMenu
									onConvertSuccess={onConvertSuccess}
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
						<div className='mt-6'>
							<DetailTabsShell
								defaultValue='children'
								onValueChange={handleTabChange}
								tabs={[
									{
										value: 'children',
										label: 'Subtopics',
										count: topic.children_count ?? 0,
										content: requestedTabs.children ? (
											<TopicChildrenPanel
												getScrollElement={getScrollElement}
												inheritFsrsState={srsSource}
												onChildSelect={onTopicNavigate}
												renderCard={renderChildCard}
												topicId={topic.id}
											/>
										) : null
									},
									{
										value: 'practice',
										label: 'Practice',
										count: topic.practices_count ?? 0,
										content: requestedTabs.practice ? (
											<TopicPracticesPanel
												getScrollElement={getScrollElement}
												inheritFsrsState={srsSource}
												onPracticeSelect={onPracticeNavigate}
												topicId={topic.id}
											/>
										) : null
									},
									{
										value: 'sources',
										label: 'Sources',
										count: topic.sources_count ?? 0,
										content: requestedTabs.sources ? (
											<TopicSourcesPanel
												getScrollElement={getScrollElement}
												inheritFsrsState={srsSource}
												onSourceSelect={onSourceNavigate}
												renderCard={renderSourceCard}
												topicId={topic.id}
											/>
										) : null
									},
									{
										value: 'related',
										label: 'Related',
										count: displayedRelatedCount,
										content: requestedTabs.related ? (
											<TopicRelatedPanel
												getScrollElement={getScrollElement}
												inheritFsrsState={srsSource}
												onCountChange={setRelatedCount}
												onRelatedSelect={onTopicNavigate}
												onSourceSelect={onSourceNavigate}
												topicId={topic.id}
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
