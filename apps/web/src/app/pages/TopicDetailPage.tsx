import { notFound, useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import {
	AlertTriangle,
	BookOpen,
	Check,
	Copy,
	MoreHorizontal,
	Plus,
	Trash2,
	User2,
	X
} from 'lucide-react'
import {
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
import { AddEntityMenu } from '~/components/ui/add-entity-menu'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Textarea } from '~/components/ui/textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { useCreateReviewCard } from '~/features/review-cards/api/createReviewCard'
import { useReviewCards } from '~/features/review-cards/api/getReviewCards'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import { SearchDialog } from '~/features/search/components/SearchDialog'
import type { SearchResultItem } from '~/features/search/types/search.types'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useDeleteTopic } from '~/features/topics/api/deleteTopic'
import { useTopic } from '~/features/topics/api/getTopic'
import { useTopics } from '~/features/topics/api/getTopics'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import { TopicCard } from '~/features/topics/components/TopicCard'
import { useFlashcardMode } from '~/stores/FlashcardModeContext'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize,
	estimateTopicCardSize
} from '~/utils/estimateMasonryItemSize'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { isHttpStatusError } from '~/utils/httpStatusError'

const EMPTY_BADGE_CLASSNAME =
	'h-5 rounded-sm border-transparent bg-amber-100 text-amber-900 text-xs shadow-sm dark:bg-amber-950 dark:text-amber-200'

type TopicDetailRevealPanelTab = 'guess' | 'reveal'

function isTopicDetailRevealPanelTab(
	value: string
): value is TopicDetailRevealPanelTab {
	return value === 'guess' || value === 'reveal'
}

export type TopicDetailTab = 'subtopics' | 'review_cards'
export type TopicDetailReviewCardFilter = 'all' | 'practice' | 'flashcard'

function isTopicDetailTab(value: string): value is TopicDetailTab {
	return value === 'subtopics' || value === 'review_cards'
}

function isTopicDetailReviewCardFilter(
	value: string
): value is TopicDetailReviewCardFilter {
	return value === 'all' || value === 'practice' || value === 'flashcard'
}

type TopicDetailPageProps = {
	topicId: number
	activeHomeTab: TopicDetailTab | string
	cardTypeFilter?: TopicDetailReviewCardFilter | string
	onActiveHomeTabChange: (tab: TopicDetailTab) => void
	onCardTypeFilterChange: (filter: TopicDetailReviewCardFilter) => void
}

export function TopicDetailPage({
	topicId,
	activeHomeTab,
	cardTypeFilter = 'all',
	onActiveHomeTabChange,
	onCardTypeFilterChange
}: TopicDetailPageProps) {
	const navigate = useNavigate()
	const resolvedActiveHomeTab = isTopicDetailTab(activeHomeTab)
		? activeHomeTab
		: 'subtopics'
	const resolvedCardTypeFilter = isTopicDetailReviewCardFilter(cardTypeFilter)
		? cardTypeFilter
		: 'all'
	const {
		data: topic,
		isLoading: isTopicLoading,
		error: topicError
	} = useTopic(topicId)
	const { data: parentTopic } = useTopic(topic?.parent_id ?? null)
	const { mutateAsync: updateTopicAsync, isPending: isUpdatingTopic } =
		useUpdateTopic()
	const { mutateAsync: createTopicAsync, isPending: isCreatingSubtopic } =
		useCreateTopic()
	const { mutateAsync: deleteTopicAsync, isPending: isDeletingTopic } =
		useDeleteTopic()
	const {
		mutateAsync: createReviewCardAsync,
		isPending: isCreatingReviewCard
	} = useCreateReviewCard()

	const [title, setTitle] = useState('')
	const [body, setBody] = useState('')
	const [isParentSearchOpen, setIsParentSearchOpen] = useState(false)
	const [parentSearchQuery, setParentSearchQuery] = useState('')
	const [isParentMutationPending, setIsParentMutationPending] = useState(false)
	const { hidesSecondary } = useFlashcardMode()
	const [revealPanelTab, setRevealPanelTab] =
		useState<TopicDetailRevealPanelTab | null>(hidesSecondary ? null : 'reveal')
	const [guessBodyText, setGuessBodyText] = useState('')
	const [isRevealPanelCopied, setIsRevealPanelCopied] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollContainerRef.current, [])

	useEffect(() => {
		if (!topic) return
		setTitle(topic.title)
		setBody(topic.body)
	}, [topic])
	useEffect(() => {
		if (!topic) return
		setRevealPanelTab(hidesSecondary ? null : 'reveal')
		setGuessBodyText('')
		setIsRevealPanelCopied(false)
	}, [hidesSecondary, topic])
	useEffect(() => {
		if (!isRevealPanelCopied) return
		const timeoutId = window.setTimeout(() => {
			setIsRevealPanelCopied(false)
		}, 1500)
		return () => {
			window.clearTimeout(timeoutId)
		}
	}, [isRevealPanelCopied])

	const selectedCardType = useMemo(() => {
		if (resolvedCardTypeFilter === 'all') return
		return resolvedCardTypeFilter
	}, [resolvedCardTypeFilter])

	const { data: subtopics = [], isLoading: isSubtopicsLoading } = useTopics(
		{
			parent_id: topicId,
			order: 'desc'
		},
		{ enabled: !isTopicLoading && topic !== undefined }
	)

	const { data: reviewCards = [], isLoading: isCardsLoading } = useReviewCards(
		{
			topic_id: topicId,
			type: selectedCardType,
			order: 'desc'
		},
		{ enabled: !isTopicLoading && topic !== undefined }
	)

	async function updateTopicFields(fields: {
		title?: string
		body?: string
		parent_id?: number | null
	}) {
		if (!topic) return
		try {
			await updateTopicAsync({ id: topic.id, ...fields })
		} catch {
			toast.error('Failed to update topic')
		}
	}

	async function handleAddSubtopic() {
		if (!topic) return
		try {
			const created = await createTopicAsync({
				parent_id: topic.id,
				title: '',
				body: ''
			})
			navigate({
				to: '/topics/$topicId',
				params: { topicId: created.id.toString() },
				search: { tab: 'subtopics' }
			})
		} catch {
			toast.error('Failed to create subtopic')
		}
	}

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

	const handleOpenSearchParent = useCallback(() => {
		if (isUpdatingTopic || isParentMutationPending) return
		setParentSearchQuery('')
		setIsParentSearchOpen(true)
	}, [isParentMutationPending, isUpdatingTopic])

	const handleAssignParent = useCallback(
		async (entity: SearchResultItem) => {
			if (!topic || entity.entity_type !== 'topic' || !entity.topic) return
			if (isParentMutationPending) return

			if (entity.topic.id === topic.id) {
				toast.error('Cannot set this topic as its own parent')
				return
			}

			if (entity.topic.id === topic.parent_id) {
				setIsParentSearchOpen(false)
				return
			}

			setIsParentMutationPending(true)
			try {
				await updateTopicAsync({ id: topic.id, parent_id: entity.topic.id })
				toast.success('Parent added')
				setIsParentSearchOpen(false)
			} catch {
				toast.error('Failed to set parent')
			} finally {
				setIsParentMutationPending(false)
			}
		},
		[isParentMutationPending, topic, updateTopicAsync]
	)

	const handleCreateParent = useCallback(async () => {
		if (!topic || isParentMutationPending) return

		setIsParentMutationPending(true)
		try {
			const created = await createTopicAsync({
				title: '',
				body: '',
				parent_id: null
			})

			try {
				await updateTopicAsync({ id: topic.id, parent_id: created.id })
				toast.success('Parent added')
				setIsParentSearchOpen(false)
			} catch {
				toast.error('Parent created but failed to set')
			}
		} catch {
			toast.error('Failed to create parent')
		} finally {
			setIsParentMutationPending(false)
		}
	}, [createTopicAsync, isParentMutationPending, topic, updateTopicAsync])

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

	const revealPanelTextareaClassName =
		'min-h-24 resize-none border-border/70 bg-background/80'
	const revealPanelCopyButtonClassName =
		'absolute right-2 bottom-2 text-muted-foreground hover:text-foreground'
	const isBodyEmpty = body.trim().length === 0
	const addParentMenu = (
		<AddEntityMenu
			buttonClassName='h-6 rounded-full px-2 text-xs'
			buttonLabel='Add parent'
			buttonSize='sm'
			buttonVariant='ghost'
			createItems={[
				{ label: 'Create', onSelect: () => void handleCreateParent() }
			]}
			disabled={isUpdatingTopic}
			isLoading={isParentMutationPending}
			onSearch={handleOpenSearchParent}
			searchLabel='Search'
			showChevron={false}
		/>
	)

	let subtopicsContent: ReactNode
	if (isSubtopicsLoading) {
		subtopicsContent = <LoadingSpinner containerClassName='min-h-40' />
	} else if (subtopics.length === 0) {
		subtopicsContent = (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<BookOpen />
					</EmptyMedia>
					<EmptyTitle>No subtopics yet</EmptyTitle>
				</EmptyHeader>
			</Empty>
		)
	} else {
		subtopicsContent = (
			<MasonryLayout
				estimateItemSize={(subtopic, _index, laneWidth) =>
					estimateTopicCardSize(subtopic, laneWidth)
				}
				gap={DEFAULT_MASONRY_GAP}
				getItemKey={subtopic => `topic-${subtopic.id}`}
				getScrollElement={getScrollElement}
				items={subtopics}
				minItemWidth={DEFAULT_MASONRY_MIN_ITEM_WIDTH}
				renderItem={subtopic => (
					<TopicCard
						onClick={() =>
							navigate({
								to: '/topics/$topicId',
								params: { topicId: subtopic.id.toString() },
								search: { tab: 'subtopics' }
							})
						}
						parentLabel={topic.title || 'Current topic'}
						topic={subtopic}
					/>
				)}
			/>
		)
	}

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

	const tabs = [
		{
			value: 'subtopics',
			label: 'Subtopics',
			count: subtopics.length,
			content: (
				<div className='space-y-4'>
					<div className='flex items-center justify-end'>
						<Button
							className='rounded-full'
							disabled={isCreatingSubtopic}
							onClick={handleAddSubtopic}
							size='sm'
							variant='outline'
						>
							<Plus className='h-4 w-4' />
							Add
						</Button>
					</div>
					{subtopicsContent}
				</div>
			)
		},
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
						<div className='ml-auto'>
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
									<DropdownMenuItem
										onClick={() => handleAddReviewCard('practice')}
									>
										Practice
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleAddReviewCard('flashcard')}
									>
										Flashcard
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
					{reviewCardsContent}
				</div>
			)
		}
	]

	return (
		<div className='flex h-full min-h-0 w-full flex-col'>
			<div className='sticky top-0 z-10 grid w-full grid-cols-[minmax(0,1fr)_auto] items-center border-b px-2 py-1'>
				<div className='flex min-w-0 items-center gap-2'>
					<div className='flex items-center gap-1 text-muted-foreground text-xs'>
						<User2 className='h-3 w-3' />
						<span>Parent</span>
					</div>
					{topic.parent_id != null ? (
						<Badge
							className='group/parent h-6 rounded-full px-1 text-xs'
							variant='ghost'
						>
							<Button
								className='h-5 cursor-pointer rounded-full px-0 font-medium text-xs leading-none'
								onClick={() =>
									navigate({
										to: '/topics/$topicId',
										params: { topicId: topic.parent_id!.toString() },
										search: { tab: 'subtopics' }
									})
								}
								size='xs'
								type='button'
								variant='ghost'
							>
								{parentTopic?.title || `Topic #${topic.parent_id}`}
							</Button>
							<Button
								aria-label='Remove parent'
								className='pointer-events-none inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full p-0 opacity-0 transition-opacity focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/parent:pointer-events-auto group-hover/parent:opacity-100 group-active/parent:pointer-events-auto group-active/parent:opacity-100'
								disabled={isUpdatingTopic}
								onClick={event => {
									event.stopPropagation()
									updateTopicFields({ parent_id: null }).catch(() => {})
								}}
								size='icon-xs'
								type='button'
								variant='ghost'
							>
								<X className='h-3 w-3' />
							</Button>
						</Badge>
					) : (
						addParentMenu
					)}
				</div>
				<div className='flex items-center justify-end'>
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
			{isParentSearchOpen ? (
				<SearchDialog
					allowedTypes={['topic']}
					closeOnSelect={false}
					createLabel='Create parent'
					filterResult={result =>
						result.entity_type === 'topic' &&
						result.topic != null &&
						result.topic.id !== topic.id
					}
					initialFilter='topic'
					isCreating={isParentMutationPending}
					onCreate={handleCreateParent}
					onOpenChange={setIsParentSearchOpen}
					onSelectEntity={handleAssignParent}
					open={isParentSearchOpen}
					placeholder='Search topics to set as parent...'
					query={parentSearchQuery}
					setQuery={setParentSearchQuery}
					showAllOption={false}
					showNoTagOption={false}
					title='Search parent topic'
				/>
			) : null}

			<div className='flex-1 overflow-y-auto' ref={scrollContainerRef}>
				<div className='mx-auto w-full max-w-5xl px-6 py-5'>
					<div className='space-y-2'>
						<Textarea
							className='!bg-transparent !text-3xl m-0 min-h-0 resize-none overflow-hidden break-words rounded-none border-none p-0 pb-1 font-bold leading-tight shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
							onBlur={() => {
								if (title !== topic.title) {
									updateTopicFields({ title }).catch(() => {})
								}
							}}
							onChange={event => setTitle(event.target.value)}
							placeholder='Untitled topic'
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
							revealPanelTab == null ? (
								<div className='relative mt-1 flex min-h-16 w-full items-center justify-center rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 px-2.5 py-2'>
									<div className='flex items-center gap-2'>
										<Button
											className='rounded-full'
											onClick={() => setRevealPanelTab('guess')}
											size='sm'
											type='button'
											variant='outline'
										>
											Type a guess
										</Button>
										<Button
											className='rounded-full'
											onClick={() => setRevealPanelTab('reveal')}
											size='sm'
											type='button'
											variant='outline'
										>
											Reveal
										</Button>
									</div>
									{isBodyEmpty ? (
										<Badge
											className={`${EMPTY_BADGE_CLASSNAME} pointer-events-none absolute top-2 right-2`}
											variant='outline'
										>
											Empty
										</Badge>
									) : null}
								</div>
							) : (
								<div className='mt-1 rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 p-2'>
									<Tabs
										className='gap-2'
										onValueChange={value => {
											if (isTopicDetailRevealPanelTab(value)) {
												setRevealPanelTab(value)
											}
										}}
										value={revealPanelTab}
									>
										<div className='flex items-start justify-between gap-2'>
											<TabsList className='h-8' variant='default'>
												<TabsTrigger className='px-2 text-xs' value='guess'>
													Guess
												</TabsTrigger>
												<TabsTrigger className='px-2 text-xs' value='reveal'>
													Reveal
												</TabsTrigger>
											</TabsList>
										</div>
										<TabsContent className='mt-0' value='guess'>
											<div className='relative'>
												<Textarea
													className={revealPanelTextareaClassName}
													onChange={event => {
														setGuessBodyText(event.target.value)
														if (isRevealPanelCopied)
															setIsRevealPanelCopied(false)
													}}
													placeholder='Type your guess...'
													spellCheck={false}
													value={guessBodyText}
												/>
												<Button
													aria-label='Copy guess text'
													className={revealPanelCopyButtonClassName}
													onClick={async () => {
														try {
															await navigator.clipboard.writeText(guessBodyText)
															setIsRevealPanelCopied(true)
															toast.success('Guess copied')
														} catch {
															toast.error('Failed to copy guess')
														}
													}}
													size='icon-xs'
													type='button'
													variant='ghost'
												>
													{isRevealPanelCopied ? (
														<Check className='h-3 w-3' />
													) : (
														<Copy className='h-3 w-3' />
													)}
												</Button>
											</div>
											<p className='mt-1 flex items-center justify-end gap-1 text-muted-foreground text-xs'>
												<AlertTriangle className='h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400' />
												<span>Guesses are not saved.</span>
											</p>
										</TabsContent>
										<TabsContent className='mt-0' value='reveal'>
											<div className='relative'>
												<Textarea
													className={revealPanelTextareaClassName}
													onBlur={() => {
														if (body !== topic.body) {
															updateTopicFields({ body }).catch(() => {})
														}
													}}
													onChange={event => setBody(event.target.value)}
													placeholder='Write your topic...'
													spellCheck={false}
													value={body}
												/>
												<Button
													aria-label='Copy reveal text'
													className={revealPanelCopyButtonClassName}
													onClick={async () => {
														try {
															await navigator.clipboard.writeText(body)
															setIsRevealPanelCopied(true)
															toast.success('Reveal copied')
														} catch {
															toast.error('Failed to copy reveal')
														}
													}}
													size='icon-xs'
													type='button'
													variant='ghost'
												>
													{isRevealPanelCopied ? (
														<Check className='h-3 w-3' />
													) : (
														<Copy className='h-3 w-3' />
													)}
												</Button>
											</div>
											<p className='mt-1 text-right text-muted-foreground text-xs'>
												Changes are automatically saved.
											</p>
										</TabsContent>
									</Tabs>
								</div>
							)
						) : (
							<Textarea
								className='!bg-transparent m-0 min-h-[2lh] resize-none overflow-hidden break-words rounded-none border-none p-0 text-base leading-relaxed shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
								onBlur={() => {
									if (body !== topic.body) {
										updateTopicFields({ body }).catch(() => {})
									}
								}}
								onChange={event => setBody(event.target.value)}
								placeholder='Write your topic...'
								spellCheck={false}
								value={body}
							/>
						)}

						<DetailTabsShell
							onValueChange={value => {
								if (value === 'subtopics' || value === 'review_cards') {
									onActiveHomeTabChange(value)
								}
							}}
							tabs={tabs}
							value={resolvedActiveHomeTab}
						/>
					</div>
				</div>
			</div>

			<Dialog onOpenChange={setIsDeleteDialogOpen} open={isDeleteDialogOpen}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>Delete topic?</DialogTitle>
						<DialogDescription>
							This will delete this topic, all subtopics, and all linked review
							cards and reviews. This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							disabled={isDeletingTopic}
							onClick={() => setIsDeleteDialogOpen(false)}
							type='button'
							variant='outline'
						>
							Cancel
						</Button>
						<Button
							disabled={isDeletingTopic}
							onClick={() => {
								handleDeleteTopic().catch(() => {})
							}}
							type='button'
							variant='destructive'
						>
							{isDeletingTopic ? 'Deleting...' : 'Delete topic'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
