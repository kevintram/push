import { Link, notFound, useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import {
	AlertTriangle,
	BookOpen,
	MoreHorizontal,
	Plus,
	Trash2
} from 'lucide-react'
import {
	Fragment,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react'
import { toast } from 'sonner'
import { DetailTabsShell } from '~/components/DetailTabs/DetailTabsShell'
import { LoadingOrError } from '~/components/LoadingOrError'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { RevealPanel } from '~/components/RevealPanel'
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
import { Badge } from '~/components/ui/badge'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from '~/components/ui/breadcrumb'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Textarea } from '~/components/ui/textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { useCreateReviewCard } from '~/features/review-cards/api/createReviewCard'
import { useReviewCards } from '~/features/review-cards/api/getReviewCards'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { useTopic } from '~/features/topics/api/getTopic'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import {
	TopicNavigatorRail,
	TopicNavigatorSheet
} from '~/features/topics/components/TopicNavigator'
import { consumeFocusNewTopicTitle } from '~/features/topics/createTopicIntent'
import { useTopicTree } from '~/features/topics/hooks/useTopicTree'
import { getTopicDisplayTitle } from '~/features/topics/utils/topicTree'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useRevealPanel } from '~/hooks/useRevealPanel'
import { useReviewMode } from '~/stores/ReviewModeContext'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize
} from '~/utils/estimateMasonryItemSize'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { isHttpStatusError } from '~/utils/httpStatusError'

const EMPTY_BADGE_CLASSNAME =
	'h-5 rounded-sm border-transparent bg-amber-100 text-amber-900 text-xs shadow-sm dark:bg-amber-950 dark:text-amber-200'

export type TopicDetailReviewCardFilter = 'all' | 'practice' | 'flashcard'

function isTopicDetailReviewCardFilter(
	value: string
): value is TopicDetailReviewCardFilter {
	return value === 'all' || value === 'practice' || value === 'flashcard'
}

type TopicDetailPageProps = {
	topicId: number
	cardTypeFilter?: TopicDetailReviewCardFilter | string
	onCardTypeFilterChange: (filter: TopicDetailReviewCardFilter) => void
}

export function TopicDetailPage({
	topicId,
	cardTypeFilter = 'all',
	onCardTypeFilterChange
}: TopicDetailPageProps) {
	const navigate = useNavigate()
	const resolvedCardTypeFilter = isTopicDetailReviewCardFilter(cardTypeFilter)
		? cardTypeFilter
		: 'all'
	const {
		data: topic,
		isLoading: isTopicLoading,
		error: topicError
	} = useTopic(topicId)
	const { ancestorIdsById, nodeById } = useTopicTree({
		enabled: !isTopicLoading && topic !== undefined
	})
	const { mutateAsync: updateTopicAsync } = useUpdateTopic()
	const { mutateAsync: deleteTopicAsync, isPending: isDeletingTopic } =
		useDeleteTopic()
	const {
		mutateAsync: createReviewCardAsync,
		isPending: isCreatingReviewCard
	} = useCreateReviewCard()

	const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
	const { hidesSecondary } = useReviewMode()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollContainerRef.current, [])

	useEffect(() => {
		if (!topic) return
		if (!consumeFocusNewTopicTitle(topic.id)) return

		titleTextareaRef.current?.focus()
	}, [topic])

	const selectedCardType = useMemo(() => {
		if (resolvedCardTypeFilter === 'all') return
		return resolvedCardTypeFilter
	}, [resolvedCardTypeFilter])

	const topicPath = useMemo(() => {
		if (!topic) return []

		const ancestorIds = ancestorIdsById.get(topic.id)
		if (!ancestorIds || ancestorIds.length === 0) {
			return [topic]
		}

		const pathTopics = ancestorIds
			.map(ancestorId => nodeById.get(ancestorId))
			.filter(topicNode => topicNode != null)

		return [...pathTopics, topic]
	}, [ancestorIdsById, nodeById, topic])

	const { data: reviewCards = [], isLoading: isCardsLoading } = useReviewCards(
		{
			topic_id: topicId,
			type: selectedCardType,
			order: 'desc'
		},
		{ enabled: !isTopicLoading && topic !== undefined }
	)

	const updateTopicFields = useCallback(
		async (fields: {
			title?: string
			body?: string
			parent_id?: number | null
		}) => {
			if (!topic) return
			try {
				await updateTopicAsync({ id: topic.id, ...fields })
			} catch {
				toast.error('Failed to update topic')
			}
		},
		[topic, updateTopicAsync]
	)

	const saveTopicTitle = useCallback(
		(newTitle: string) => {
			if (!topic || newTitle === topic.title) return
			updateTopicFields({ title: newTitle }).catch(() => {})
		},
		[topic, updateTopicFields]
	)

	const saveTopicBody = useCallback(
		(newBody: string) => {
			if (!topic || newBody === topic.body) return
			updateTopicFields({ body: newBody }).catch(() => {})
		},
		[topic, updateTopicFields]
	)

	const {
		value: title,
		onChange: onTitleChange,
		flush: flushTitle
	} = useAutoSave({
		initialValue: topic?.title ?? '',
		onSave: saveTopicTitle,
		key: `topic-title-${topic?.id ?? 'new'}`
	})

	const {
		value: body,
		onChange: onBodyChange,
		setValue: setBody,
		flush: flushBody
	} = useAutoSave({
		initialValue: topic?.body ?? '',
		onSave: saveTopicBody,
		key: `topic-body-${topic?.id ?? 'new'}`
	})

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
		entityId: topic?.id ?? null,
		hidesSecondary,
		defaultTab: hidesSecondary ? null : 'reveal'
	})

	async function handleAddReviewCard(type: 'practice' | 'flashcard') {
		if (!topic) return
		try {
			const created = await createReviewCardAsync({
				topic_id: topic.id,
				type,
				prompt: '',
				answer: '',
				retired: false
			})
			navigate({
				to: '/review-cards/$reviewCardId',
				params: { reviewCardId: created.id.toString() },
				search: { tab: 'home' }
			})
		} catch {
			toast.error('Failed to create review card')
		}
	}

	async function handleDeleteTopic() {
		if (!topic || isDeletingTopic) return
		try {
			await deleteTopicAsync(topic.id)
			setIsDeleteDialogOpen(false)
			toast.success('Topic deleted')
			navigate({ to: '/topics' })
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete topic'
			)
		}
	}

	if (isTopicLoading) {
		return (
			<div className='flex h-full min-h-0 w-full items-center justify-center'>
				<LoadingSpinner containerClassName='min-h-64' />
			</div>
		)
	}

	if (topicError) {
		if (isHttpStatusError(topicError) && topicError.status === 404) {
			throw notFound()
		}
		return (
			<LoadingOrError
				error={
					topicError instanceof Error
						? topicError
						: new Error('Failed to load topic')
				}
			/>
		)
	}

	if (!topic) {
		throw notFound()
	}

	const isBodyEmpty = body.trim().length === 0

	let reviewCardsContent: ReactNode
	if (isCardsLoading) {
		reviewCardsContent = <LoadingSpinner containerClassName='min-h-40' />
	} else if (reviewCards.length === 0) {
		reviewCardsContent = (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<BookOpen />
					</EmptyMedia>
					<EmptyTitle>No review cards in this filter</EmptyTitle>
				</EmptyHeader>
			</Empty>
		)
	} else {
		reviewCardsContent = (
			<MasonryLayout
				estimateItemSize={(card, _index, laneWidth) =>
					estimateReviewCardSize(card, laneWidth)
				}
				gap={DEFAULT_MASONRY_GAP}
				getItemKey={card => `review-card-${card.id}`}
				getScrollElement={getScrollElement}
				items={reviewCards}
				minItemWidth={DEFAULT_MASONRY_MIN_ITEM_WIDTH}
				renderItem={card => (
					<ReviewCard
						onClick={() =>
							navigate({
								to: '/review-cards/$reviewCardId',
								params: { reviewCardId: card.id.toString() },
								search: { tab: 'home' }
							})
						}
						parentLabel={topic.title || 'Current topic'}
						reviewCard={card}
					/>
				)}
			/>
		)
	}

	const reviewCardAddButton = (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						className='rounded-full'
						disabled={isCreatingReviewCard}
						size='sm'
						variant='outline'
					>
						<Plus className='h-4 w-4' />
						Add
					</Button>
				}
			/>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem onClick={() => handleAddReviewCard('practice')}>
					Practice
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleAddReviewCard('flashcard')}>
					Flashcard
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)

	const tabs = [
		{
			value: 'review_cards',
			label: 'Review Cards',
			count: reviewCards.length,
			content: (
				<div className='space-y-4'>
					<div className='flex items-center gap-2'>
						<Badge
							className='cursor-pointer'
							onClick={() => onCardTypeFilterChange('all')}
							variant={resolvedCardTypeFilter === 'all' ? 'default' : 'outline'}
						>
							All
						</Badge>
						<Badge
							className='cursor-pointer'
							onClick={() => onCardTypeFilterChange('practice')}
							variant={
								resolvedCardTypeFilter === 'practice' ? 'default' : 'outline'
							}
						>
							Practice
						</Badge>
						<Badge
							className='cursor-pointer'
							onClick={() => onCardTypeFilterChange('flashcard')}
							variant={
								resolvedCardTypeFilter === 'flashcard' ? 'default' : 'outline'
							}
						>
							Flashcard
						</Badge>
					</div>
					{reviewCardsContent}
				</div>
			)
		}
	]

	return (
		<div className='flex h-full min-h-0 w-full'>
			<TopicNavigatorRail activeTopicId={topic.id} />
			<div className='flex min-h-0 min-w-0 flex-1 flex-col'>
				<div className='sticky top-0 z-10 flex w-full items-center justify-end px-2 py-1'>
					<div className='flex items-center justify-end gap-2'>
						<TopicNavigatorSheet activeTopicId={topic.id} />
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button size='icon-sm' type='button' variant='ghost'>
										<MoreHorizontal className='h-4 w-4' />
									</Button>
								}
							/>
							<DropdownMenuContent align='end' side='bottom' sideOffset={4}>
								<DropdownMenuItem
									onClick={() => setIsDeleteDialogOpen(true)}
									variant='destructive'
								>
									<Trash2 className='mr-2 h-4 w-4' />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				<div className='flex-1 overflow-y-auto' ref={scrollContainerRef}>
					<div className='mx-auto w-full max-w-5xl px-6 py-5'>
						<div className='min-w-0 space-y-2'>
							<Breadcrumb aria-label='Topic path'>
								<BreadcrumbList>
									{topicPath.map((pathTopic, index) => {
										const label = getTopicDisplayTitle(
											pathTopic.title,
											pathTopic.body
										)
										const isCurrentTopic = index === topicPath.length - 1

										return (
											<Fragment key={pathTopic.id}>
												{index > 0 ? <BreadcrumbSeparator /> : null}
												<BreadcrumbItem className='min-w-0'>
													{isCurrentTopic ? (
														<BreadcrumbPage className='truncate font-medium'>
															{label}
														</BreadcrumbPage>
													) : (
														<BreadcrumbLink
															className='truncate'
															render={
																<Link
																	params={{ topicId: pathTopic.id.toString() }}
																	to='/topics/$topicId'
																/>
															}
														>
															{label}
														</BreadcrumbLink>
													)}
												</BreadcrumbItem>
											</Fragment>
										)
									})}
								</BreadcrumbList>
							</Breadcrumb>
							<Textarea
								aria-label='Topic title'
								className='!bg-transparent !text-3xl m-0 min-h-0 resize-none overflow-hidden break-words rounded-none border-none p-0 pb-1 font-bold leading-tight shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
								onBlur={flushTitle}
								onChange={onTitleChange}
								placeholder='Untitled topic'
								ref={titleTextareaRef}
								spellCheck={false}
								value={title}
							/>

							<div className='flex flex-wrap items-center gap-2 font-semibold text-muted-foreground text-sm'>
								<Tooltip>
									<TooltipTrigger
										render={
											<span>{`Edited ${formatRelativeDate(topic.updated_at).text}`}</span>
										}
									/>
									<TooltipContent>
										{dayjs(topic.updated_at).format('MMM D, YYYY')}
									</TooltipContent>
								</Tooltip>
								<span aria-hidden={true}>·</span>
								<Tooltip>
									<TooltipTrigger
										render={
											<span>{`Created ${formatRelativeDate(topic.inserted_at).text}`}</span>
										}
									/>
									<TooltipContent>
										{dayjs(topic.inserted_at).format('MMM D, YYYY')}
									</TooltipContent>
								</Tooltip>
							</div>

							{hidesSecondary ? (
								<RevealPanel
									closedContent={
										isBodyEmpty ? (
											<Badge
												className={`${EMPTY_BADGE_CLASSNAME} pointer-events-none absolute top-2 right-2`}
												variant='outline'
											>
												Empty
											</Badge>
										) : null
									}
									guessValue={guessBodyText}
									isCopied={isRevealPanelCopied}
									onGuessCopy={handleCopyGuessText}
									onGuessValueChange={setGuessBodyText}
									onRevealBlur={flushBody}
									onRevealCopy={handleCopyRevealText}
									onRevealValueChange={setBody}
									onValueChange={setRevealPanelTab}
									revealHelperVariant='autosave'
									revealPlaceholder='Write your topic...'
									revealValue={body}
									value={revealPanelTab}
									variant='detail'
								/>
							) : (
								<Textarea
									className='!bg-transparent m-0 min-h-[2lh] resize-none overflow-hidden break-words rounded-none border-none p-0 text-base leading-relaxed shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
									onBlur={flushBody}
									onChange={onBodyChange}
									placeholder='Write your topic...'
									spellCheck={false}
									value={body}
								/>
							)}

							<DetailTabsShell
								defaultValue='review_cards'
								headerEndContent={reviewCardAddButton}
								tabs={tabs}
							/>
						</div>
					</div>
				</div>
			</div>

			<AlertDialog
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
			>
				<AlertDialogContent size='sm'>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<AlertTriangle className='h-5 w-5' />
						</AlertDialogMedia>
						<AlertDialogTitle>Delete topic?</AlertDialogTitle>
						<AlertDialogDescription>
							This will delete this topic, all subtopics, and all linked review
							cards and reviews. This action cannot be undone.
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
		</div>
	)
}
