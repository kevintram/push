import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
	Anchor,
	Archive,
	ArchiveX,
	BookOpen,
	Brain,
	Inbox,
	MoreHorizontal,
	Sparkles,
	X
} from 'lucide-react'
import {
	type ReactNode,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef
} from 'react'
import { BookOpenOff } from '~/components/icons'
import { Button } from '~/components/ui/Button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { SidebarHolder, SidebarProvider } from '~/components/ui/Sidebar'
import { Textarea } from '~/components/ui/Textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { cn } from '~/lib/utils'
import {
	calculateDaysSinceLate,
	formatRetrievability,
	getRetrievabilityBucket,
	getThresholdCrossingInfo
} from '~/utils/retrievability'
import { topicKeys } from '../../api/queryKeys'
import { useUpdateTopic } from '../../api/updateTopic'
import { TopicContext } from '../../stores/SelectedTopicContext'
import type { Topic } from '../../types/topic.types'
import { TopicActionMenu } from '../TopicActionMenu'
import { TopicChildrenPanel } from '../TopicChildrenPanel'
import { TopicRelatedPanel } from '../TopicRelatedPanel'
import { ReviewsSidebar } from './ReviewSidebar'
import { TopicDetailHeader } from './TopicDetailHeader'
import { TopicDetailSkeleton } from './TopicDetailSkeleton'

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
	 * Custom card renderer for children panel.
	 */
	renderChildCard?: (
		topic: Topic,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
	/**
	 * Custom card renderer for related panel.
	 */
	renderRelatedCard?: (
		topic: Topic,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
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
	renderChildCard,
	renderRelatedCard,
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

	// Calculate retrievability display
	const retrievabilityDisplay = useMemo(() => {
		if (topic?.retrievability == null) return null
		return formatRetrievability(topic.retrievability)
	}, [topic?.retrievability])

	// Threshold crossing info for bucket days calculation
	const thresholdInfo = useMemo(
		() =>
			getThresholdCrossingInfo(
				topic?.retrievability ?? null,
				topic?.stability ?? null,
				topic?.last_reviewed_at ?? null
			),
		[topic?.retrievability, topic?.stability, topic?.last_reviewed_at]
	)

	// Calculate bucket info for display (matching TopicCard format)
	const bucketInfo = useMemo(() => {
		if (topic?.retrievability == null) {
			return {
				label: '—',
				days: null,
				suffix: null
			}
		}

		const bucket = getRetrievabilityBucket(topic.retrievability)

		switch (bucket) {
			case 'early': {
				const days = thresholdInfo?.daysUntil ?? 0
				return {
					label: 'Early',
					days,
					suffix: 'left'
				}
			}
			case 'onTime': {
				const days = thresholdInfo?.daysUntil ?? 0
				return {
					label: 'Ready',
					days,
					suffix: 'left'
				}
			}
			case 'late': {
				const days = calculateDaysSinceLate(
					topic.stability,
					topic.last_reviewed_at
				)
				return {
					label: 'Late',
					days,
					suffix: 'ago'
				}
			}
			default:
				return bucket satisfies never
		}
	}, [
		topic?.retrievability,
		topic?.stability,
		topic?.last_reviewed_at,
		thresholdInfo
	])

	const stabilityText =
		topic?.stability != null ? `${Math.round(topic.stability)}d` : '—'

	// Check if this is a truly new topic (no reviews, no inherited state)
	const isNewTopic = useMemo(() => {
		return (
			topic?.retrievability === null &&
			!topic?.last_reviewed_at &&
			topic?.inherited_stability === null
		)
	}, [
		topic?.retrievability,
		topic?.last_reviewed_at,
		topic?.inherited_stability
	])

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

	const notesRef = useRef<HTMLTextAreaElement | null>(null)
	const [scrollContainerRef] = useResizeObserver<HTMLDivElement>()

	// focus on notes whenever selected topic changes
	useEffect(() => {
		if (notesRef.current && topic?.id) {
			notesRef.current.focus()
		}
	}, [topic?.id])

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
						{(topic.archived || topic.inboxed) && (
							<div className='-translate-x-2 flex flex-row'>
								{topic.archived && (
									<Popover>
										<PopoverTrigger asChild={true}>
											<Button
												className='flex items-center'
												size='sm'
												variant='ghost'
											>
												<Archive className='h-4 w-4 text-muted-foreground' />
												<span className='text-muted-foreground text-xs'>
													Archived
												</span>
											</Button>
										</PopoverTrigger>
										<PopoverContent className='w-auto p-2'>
											<Button
												className='w-full justify-start'
												onClick={handleArchiveToggle}
												size='sm'
												variant='ghost'
											>
												<ArchiveX className='mr-2 h-4 w-4' />
												Unarchive
											</Button>
										</PopoverContent>
									</Popover>
								)}
								{topic.inboxed && (
									<Popover>
										<PopoverTrigger asChild={true}>
											<Button
												className='flex items-center'
												size='sm'
												variant='ghost'
											>
												<Inbox className='h-4 w-4 text-muted-foreground' />
												<span className='text-muted-foreground text-xs'>
													Inboxed
												</span>
											</Button>
										</PopoverTrigger>
										<PopoverContent className='w-auto p-2'>
											<Button
												className='w-full justify-start'
												onClick={handleInboxToggle}
												size='sm'
												variant='ghost'
											>
												<X className='mr-2 h-4 w-4' />
												Remove from inbox
											</Button>
										</PopoverContent>
									</Popover>
								)}
							</div>
						)}
						<div className='flex items-start gap-2'>
							<Textarea
								className='!mt-0.5 !bg-transparent break-word !text-xl m-0 min-h-0 flex-1 resize-none overflow-hidden rounded-none border-none p-0 font-extrabold shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
								onChange={onNameChange}
								placeholder='Title'
								spellCheck={false}
								value={title}
							/>
							<div className='flex items-center gap-2'>
								<Tooltip>
									<TooltipTrigger asChild={true}>
										<Button
											disabled={isUpdatingTopic || sidebarReadonly}
											onClick={() =>
												handleSrsToggle(!(topic.srs_enabled ?? true))
											}
											size='icon-sm'
											variant='outline'
										>
											{(topic.srs_enabled ?? true) ? (
												<BookOpen className='h-5 w-5 text-green-500' />
											) : (
												<BookOpenOff className='h-5 w-5 text-muted-foreground' />
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent side='bottom'>
										Surface in review page
									</TooltipContent>
								</Tooltip>
								<TopicActionMenu
									onDelete={onDelete}
									onTopicUpdateSuccess={handleTopicUpdateSuccess}
									topic={topic}
									trigger={
										<Button
											size='icon-sm'
											title='More options'
											variant='outline'
										>
											<MoreHorizontal className='h-5 w-5' />
										</Button>
									}
								/>
							</div>
						</div>
						<div className='flex flex-col gap-1'>
							<div className='mb-3 flex items-center justify-start gap-2 font-semibold text-sm'>
								{isNewTopic ? (
									<div className='flex items-center gap-1'>
										<Sparkles className='h-3 w-3' />
										<span>New</span>
									</div>
								) : (
									<>
										{/* Bucket status */}
										<Tooltip>
											<TooltipTrigger asChild={true}>
												<div className='flex items-center gap-1'>
													<BookOpen className='h-3 w-3' />
													<span>
														{bucketInfo.label}
														{bucketInfo.days !== null &&
															` (${bucketInfo.days}d ${bucketInfo.suffix})`}
													</span>
												</div>
											</TooltipTrigger>
											<TooltipContent side='bottom'>
												{(() => {
													switch (bucketInfo.label) {
														case 'Ready':
															return `Ready to review, ${bucketInfo.days} days until late`
														case 'Early':
															return `A little early to review, ${bucketInfo.days} days until ready`
														case 'Late':
															return `${bucketInfo.days} days late, ready for a risky review`
														default:
															return 'Complete a review to see status'
													}
												})()}
											</TooltipContent>
										</Tooltip>
										<span>⋅</span>
										{/* Retrievability */}
										<Tooltip>
											<TooltipTrigger asChild={true}>
												<div className='flex items-center gap-1'>
													<Brain className='h-3 w-3' />
													<span>{retrievabilityDisplay ?? '—'}</span>
												</div>
											</TooltipTrigger>
											<TooltipContent side='bottom'>
												{topic.retrievability != null
													? `${retrievabilityDisplay} chance of successfully recalling today`
													: 'Complete a review to calculate retrievability'}
											</TooltipContent>
										</Tooltip>
										<span>⋅</span>
										{/* Stability */}
										<Tooltip>
											<TooltipTrigger asChild={true}>
												<div className='flex items-center gap-1'>
													<Anchor className='h-3 w-3' />
													<span>{stabilityText}</span>
												</div>
											</TooltipTrigger>
											<TooltipContent side='bottom'>
												Durable for{' '}
												{topic?.stability != null
													? `${Math.round(topic.stability)} days`
													: '—'}{' '}
												without review
											</TooltipContent>
										</Tooltip>
									</>
								)}
								<span>⋅</span>
								{/* Edited date with edited AND created date in tooltip */}
								<Tooltip>
									<TooltipTrigger asChild={true}>
										<span>{dayjs(topic.updated_at).format('MMM D, YYYY')}</span>
									</TooltipTrigger>
									<TooltipContent side='bottom'>
										<div className='grid grid-cols-[auto_1fr] gap-x-2'>
											<span>Edited:</span>
											<span>
												{dayjs(topic.updated_at).format('MMM D, YYYY')}
											</span>
											<span>Created:</span>
											<span>
												{dayjs(topic.inserted_at).format('MMM D, YYYY')}
											</span>
										</div>
									</TooltipContent>
								</Tooltip>
							</div>
							<Textarea
								className='!bg-transparent m-0 w-full resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
								name='notes'
								onChange={onNotesChange}
								placeholder='Notes'
								ref={notesRef}
								value={notes}
							/>
						</div>
						<TopicChildrenPanel
							getScrollElement={() => scrollContainerRef.current}
							onChildSelect={onTopicNavigate}
							parentDifficulty={topic.difficulty}
							parentLastReviewedAt={topic.last_reviewed_at}
							parentStability={topic.stability}
							parentState={topic.state}
							parentStep={topic.step}
							renderCard={renderChildCard}
							topicId={topic.id}
						/>
						<div className='mt-4'>
							<TopicRelatedPanel
								getScrollElement={() => scrollContainerRef.current}
								onRelatedSelect={onTopicNavigate}
								renderCard={renderRelatedCard}
								topicId={topic.id}
							/>
						</div>{' '}
					</div>
					<ReviewsSidebar readonly={sidebarReadonly} />
				</SidebarHolder>
			</div>
		</SidebarProvider>
	)
}
