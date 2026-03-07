import {
	AlertTriangle,
	CalendarClock,
	Check,
	Copy,
	MoreHorizontal,
	PenLine,
	Trash2,
	User2
} from 'lucide-react'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Textarea } from '~/components/ui/textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { cn } from '~/lib/utils'
import { useReviewMode } from '~/stores/ReviewModeContext'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import { useDeleteTopic } from '../api/deleteTopic'
import type { Topic } from '../types/topic.types'

const MIN_HEIGHT = 96
const CARD_HEIGHT_GUESS_PANEL_MIN = 300
const REVEAL_PANEL_TEXTAREA_CLASSNAME =
	'h-full min-h-24 resize-none border-border/70 bg-background/80 text-sm'
const REVEAL_PANEL_COPY_BUTTON_CLASSNAME =
	'absolute right-2 bottom-2 text-muted-foreground hover:text-foreground'

type TopicCardRevealPanelTab = 'guess' | 'reveal'

function isTopicCardRevealPanelTab(
	value: string
): value is TopicCardRevealPanelTab {
	return value === 'guess' || value === 'reveal'
}

interface TopicCardProps {
	topic: Topic
	onClick?: () => void
	parentLabel?: string
	minHeight?: number
}

export function TopicCard({
	topic,
	onClick,
	parentLabel,
	minHeight = MIN_HEIGHT
}: TopicCardProps) {
	const [cardRef, cardRect] = useResizeObserver<HTMLDivElement>()
	const deleteTopicMutation = useDeleteTopic()
	const { hidesSecondary } = useReviewMode()
	const [isSecondaryRevealed, setIsSecondaryRevealed] = useState(
		!hidesSecondary
	)
	const [revealPanelTab, setRevealPanelTab] =
		useState<TopicCardRevealPanelTab | null>(null)
	const [guessBodyText, setGuessBodyText] = useState('')
	const [isRevealPanelCopied, setIsRevealPanelCopied] = useState(false)

	const resolvedParentLabel =
		parentLabel ??
		topic.parent_title?.trim() ??
		(topic.parent_id != null ? `Topic #${topic.parent_id}` : 'No parent')
	const hasBodyText = Boolean(topic.body.trim())
	const hideSecondary = hidesSecondary && hasBodyText && !isSecondaryRevealed
	const hasMeasuredCardHeight = cardRect.height > 0
	const effectiveCardHeight = hasMeasuredCardHeight
		? cardRect.height
		: minHeight
	const isLargeCard = effectiveCardHeight >= CARD_HEIGHT_GUESS_PANEL_MIN
	const canUseGuessPanel = hidesSecondary && hasBodyText && isLargeCard

	const updated = useMemo(
		() =>
			formatRelativeDate(topic.updated_at, {
				includeFuture: false,
				nullLabel: 'never'
			}),
		[topic.updated_at]
	)
	const created = useMemo(
		() =>
			formatRelativeDate(topic.inserted_at, {
				includeFuture: false,
				nullLabel: 'never'
			}),
		[topic.inserted_at]
	)

	const updatedDate = useMemo(
		() => formatAbsoluteDate(topic.updated_at),
		[topic.updated_at]
	)
	const createdDate = useMemo(
		() => formatAbsoluteDate(topic.inserted_at),
		[topic.inserted_at]
	)

	const handleActivate = useCallback(() => {
		onClick?.()
	}, [onClick])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onClick?.()
			}
		},
		[onClick]
	)
	const handleRevealSecondary = useCallback((event: MouseEvent) => {
		event.stopPropagation()
		setIsSecondaryRevealed(true)
	}, [])
	const handleRevealPanelTabChange = useCallback((value: string) => {
		if (isTopicCardRevealPanelTab(value)) {
			setRevealPanelTab(value)
		}
	}, [])
	const handleCopyGuessText = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(guessBodyText)
			setIsRevealPanelCopied(true)
			toast.success('Guess copied')
		} catch {
			toast.error('Failed to copy guess')
		}
	}, [guessBodyText])
	const handleCopyRevealText = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(topic.body)
			setIsRevealPanelCopied(true)
			toast.success('Reveal copied')
		} catch {
			toast.error('Failed to copy reveal')
		}
	}, [topic.body])
	const handleDeleteTopic = useCallback(async () => {
		if (deleteTopicMutation.isPending) return
		try {
			await deleteTopicMutation.mutateAsync(topic.id)
			toast.success('Topic deleted')
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete topic'
			)
		}
	}, [deleteTopicMutation, topic.id])

	useEffect(() => {
		if (topic.id < 0) return
		setIsSecondaryRevealed(!hidesSecondary)
	}, [hidesSecondary, topic.id])
	useEffect(() => {
		if (topic.id < 0) return
		setRevealPanelTab(null)
		setGuessBodyText('')
		setIsRevealPanelCopied(false)
	}, [topic.id])
	useEffect(() => {
		if (!hidesSecondary) {
			setRevealPanelTab(null)
			setGuessBodyText('')
			setIsRevealPanelCopied(false)
			return
		}
		if (canUseGuessPanel) {
			setRevealPanelTab(null)
			setGuessBodyText('')
			setIsRevealPanelCopied(false)
			return
		}
		setRevealPanelTab(null)
		setGuessBodyText('')
		setIsRevealPanelCopied(false)
	}, [hidesSecondary, canUseGuessPanel])
	useEffect(() => {
		if (!isRevealPanelCopied) return
		const timeoutId = window.setTimeout(() => {
			setIsRevealPanelCopied(false)
		}, 1500)
		return () => {
			window.clearTimeout(timeoutId)
		}
	}, [isRevealPanelCopied])

	let secondaryContent: ReactNode
	if (hideSecondary) {
		if (canUseGuessPanel) {
			secondaryContent =
				revealPanelTab == null ? (
					<div className='relative mt-1 flex h-full min-h-16 w-full flex-1 items-center justify-center rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 px-2.5 py-2'>
						<div className='flex items-center gap-2'>
							<Button
								className='rounded-full'
								onClick={event => {
									event.stopPropagation()
									setRevealPanelTab('guess')
								}}
								size='sm'
								type='button'
								variant='outline'
							>
								Type a guess
							</Button>
							<Button
								className='rounded-full'
								onClick={event => {
									event.stopPropagation()
									setRevealPanelTab('reveal')
								}}
								size='sm'
								type='button'
								variant='outline'
							>
								Reveal
							</Button>
						</div>
					</div>
				) : (
					<div className='mt-1 flex h-full min-h-16 flex-1 flex-col rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 p-2'>
						<Tabs
							className='flex h-full min-h-0 flex-col gap-2'
							onValueChange={handleRevealPanelTabChange}
							value={revealPanelTab}
						>
							<div className='flex items-start justify-between gap-2'>
								<TabsList
									className='h-8'
									onClick={event => event.stopPropagation()}
									onKeyDown={event => event.stopPropagation()}
									variant='default'
								>
									<TabsTrigger
										className='px-2 text-xs'
										onClick={event => event.stopPropagation()}
										onKeyDown={event => event.stopPropagation()}
										value='guess'
									>
										Guess
									</TabsTrigger>
									<TabsTrigger
										className='px-2 text-xs'
										onClick={event => event.stopPropagation()}
										onKeyDown={event => event.stopPropagation()}
										value='reveal'
									>
										Reveal
									</TabsTrigger>
								</TabsList>
							</div>
							<TabsContent
								className='mt-0 flex min-h-0 flex-1 flex-col'
								value='guess'
							>
								<div className='relative min-h-0 flex-1'>
									<Textarea
										className={REVEAL_PANEL_TEXTAREA_CLASSNAME}
										onChange={event => {
											setGuessBodyText(event.target.value)
											if (isRevealPanelCopied) setIsRevealPanelCopied(false)
										}}
										onClick={event => event.stopPropagation()}
										onKeyDown={event => event.stopPropagation()}
										placeholder='Type your guess...'
										spellCheck={false}
										value={guessBodyText}
									/>
									<Button
										aria-label='Copy guess text'
										className={REVEAL_PANEL_COPY_BUTTON_CLASSNAME}
										onClick={event => {
											event.stopPropagation()
											handleCopyGuessText().catch(() => {})
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
							<TabsContent
								className='mt-0 flex min-h-0 flex-1 flex-col'
								value='reveal'
							>
								<div className='relative min-h-0 flex-1'>
									<Textarea
										className={REVEAL_PANEL_TEXTAREA_CLASSNAME}
										onClick={event => event.stopPropagation()}
										onKeyDown={event => event.stopPropagation()}
										readOnly={true}
										spellCheck={false}
										value={topic.body}
									/>
									<Button
										aria-label='Copy reveal text'
										className={REVEAL_PANEL_COPY_BUTTON_CLASSNAME}
										onClick={event => {
											event.stopPropagation()
											handleCopyRevealText().catch(() => {})
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
							</TabsContent>
						</Tabs>
					</div>
				)
		} else {
			secondaryContent = (
				<div className='relative'>
					<p
						aria-hidden={true}
						className='break-word invisible line-clamp-[8] whitespace-pre-wrap text-sm [overflow-wrap:anywhere]'
					>
						{topic.body}
					</p>
					<div className='absolute inset-0'>
						<Button
							className='h-full w-full justify-center rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 px-2.5 py-2 text-muted-foreground text-sm hover:bg-muted/70'
							onClick={handleRevealSecondary}
							onKeyDown={event => event.stopPropagation()}
							size='default'
							variant='outline'
						>
							Reveal
						</Button>
					</div>
				</div>
			)
		}
	} else {
		secondaryContent =
			topic.body.trim().length > 0 ? (
				<p
					className={cn(
						'break-word whitespace-pre-wrap text-sm [overflow-wrap:anywhere]',
						isLargeCard ? 'min-h-0 flex-1 overflow-y-auto' : 'line-clamp-[8]'
					)}
				>
					{topic.body}
				</p>
			) : null
	}

	return (
		<Card
			className={cn(
				'relative max-h-96 gap-0 overflow-visible p-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
				onClick ? 'cursor-pointer hover:bg-muted/50' : null
			)}
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			ref={cardRef}
			role={onClick ? 'button' : undefined}
			style={{ minHeight: `${minHeight}px` }}
			tabIndex={onClick ? 0 : undefined}
		>
			<CardHeader className='relative flex min-h-8 items-center justify-between gap-2 p-0 pb-1'>
				<Tooltip>
					<TooltipTrigger
						render={
							<div className='flex min-w-0 items-center gap-1 font-semibold text-muted-foreground text-xs'>
								<User2 className='h-3 w-3 shrink-0' />
								<span className='truncate'>{resolvedParentLabel}</span>
							</div>
						}
					/>
					<TooltipContent>{resolvedParentLabel}</TooltipContent>
				</Tooltip>
				<div className='flex-1' />
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								className='h-5 w-5 p-0'
								onClick={event => event.stopPropagation()}
								onKeyDown={event => event.stopPropagation()}
								variant='ghost'
							>
								<MoreHorizontal className='h-3 w-3' />
							</Button>
						}
					/>
					<DropdownMenuContent align='end' side='bottom' sideOffset={2}>
						<DropdownMenuItem
							disabled={deleteTopicMutation.isPending}
							onClick={event => {
								event.stopPropagation()
								handleDeleteTopic().catch(() => {})
							}}
							variant='destructive'
						>
							<Trash2 className='mr-2 h-4 w-4' />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>

			<CardContent className='flex min-h-0 flex-1 flex-col gap-3 p-0'>
				<div className='flex min-h-0 flex-1 flex-col gap-1'>
					<div className='flex items-center gap-1 text-muted-foreground text-xs'>
						<span>Topic</span>
					</div>

					<div className='flex min-h-0 flex-1 flex-col gap-2'>
						{topic.title.trim().length > 0 ? (
							<h3 className='break-word line-clamp-5 whitespace-pre-wrap font-semibold leading-tight [overflow-wrap:anywhere]'>
								{topic.title}
							</h3>
						) : null}
						{secondaryContent}
					</div>
				</div>
			</CardContent>

			<CardFooter className='gap-1 px-0 pt-2 text-muted-foreground text-xs'>
				<Tooltip>
					<TooltipTrigger
						render={
							<div className='flex items-center gap-1'>
								<PenLine className='h-3 w-3' />
								<span>{`Edited ${updated.text}`}</span>
							</div>
						}
					/>
					<TooltipContent>{updatedDate}</TooltipContent>
				</Tooltip>
				<span className='font-bold'>·</span>
				<Tooltip>
					<TooltipTrigger
						render={
							<div className='flex items-center gap-1'>
								<CalendarClock className='h-3 w-3' />
								<span>{`Created ${created.text}`}</span>
							</div>
						}
					/>
					<TooltipContent>{createdDate}</TooltipContent>
				</Tooltip>
			</CardFooter>
		</Card>
	)
}
