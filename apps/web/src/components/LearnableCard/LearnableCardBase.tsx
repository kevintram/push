import type { QueryClient } from '@tanstack/react-query'
import {
	Archive,
	Baby,
	BookOpen,
	Brain,
	Calendar,
	FileText,
	Inbox,
	Sparkles,
	User2
} from 'lucide-react'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useCallback, useMemo } from 'react'
import { BookOpenOff } from '~/components/icons'
import { Badge } from '~/components/ui/Badge'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/Card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import type { BucketInfo, LearnableMetrics } from '~/hooks/useLearnableMetrics'
import type { LearnableBase } from '~/models/learnable.types'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'

const MIN_HEIGHT = 96

export interface LearnableCardConfig<T extends LearnableBase> {
	/** Get the primary text to display (name/title) */
	getPrimaryText: (entity: T) => string
	/** Whether to show a type badge in the header */
	showTypeBadge: boolean
	/** Label for the type badge (e.g., "Source") */
	typeBadgeLabel?: string
	/** Format children count for tooltip (e.g., "1 child source" vs "1 child") */
	getChildrenLabel: (count: number) => string
	/** The update mutation function */
	onSrsToggle: (id: number, newValue: boolean) => void
	/** Whether the mutation is pending */
	isUpdating: boolean
	/** Prefetch entity data on hover */
	onPrefetch: (queryClient: QueryClient, entity: T) => void
	/** Get the "leaving soon" tooltip text */
	getLeavingSoonTooltip: (
		daysUntil: number,
		bucketLabel: BucketInfo['label']
	) => string
}

export interface LearnableCardBaseProps<T extends LearnableBase> {
	entity: T
	config: LearnableCardConfig<T>
	metrics: LearnableMetrics
	queryClient: QueryClient
	onEntityClick?: (entity: T) => void
	minHeight?: number
	searchQuery?: string
	headerRight?: ReactNode
	showLeavingSoon?: boolean
}

export function LearnableCardBase<T extends LearnableBase>({
	entity,
	config,
	metrics,
	queryClient,
	onEntityClick,
	minHeight = MIN_HEIGHT,
	searchQuery,
	headerRight,
	showLeavingSoon = false
}: LearnableCardBaseProps<T>) {
	const {
		bucketInfo,
		isUnreviewed,
		isLeavingSoon,
		retrievabilityDisplay,
		thresholdInfo
	} = metrics

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(entity.last_reviewed_at, {
				includeFuture: false,
				nullLabel: 'never'
			}),
		[entity.last_reviewed_at]
	)

	// Search highlighting
	const primaryText = config.getPrimaryText(entity)
	const highlightedPrimary = useMemo(() => {
		if (!primaryText) return null
		if (!searchQuery?.trim()) return primaryText
		return highlightText({ text: primaryText, query: searchQuery })
	}, [primaryText, searchQuery])

	const highlightedNotes = useMemo(() => {
		if (!entity.notes) return null
		if (!searchQuery?.trim()) return entity.notes
		return truncateWithHighlight(entity.notes, searchQuery, 200)
	}, [entity.notes, searchQuery])

	const handleActivate = useCallback(() => {
		onEntityClick?.(entity)
	}, [onEntityClick, entity])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onEntityClick?.(entity)
			}
		},
		[onEntityClick, entity]
	)

	const handleMouseEnter = useCallback(() => {
		config.onPrefetch(queryClient, entity)
	}, [config, queryClient, entity])

	const handleSrsToggle = useCallback(
		(e: MouseEvent) => {
			e.stopPropagation()
			config.onSrsToggle(entity.id, !entity.srs_enabled)
		},
		[config, entity.id, entity.srs_enabled]
	)

	return (
		<Card
			className='max-h-96 cursor-pointer overflow-hidden transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			onMouseEnter={handleMouseEnter}
			role='button'
			style={{ minHeight: `${minHeight}px` }}
			tabIndex={0}
		>
			<CardHeader className='-top-1 -left-1 relative flex items-start justify-between gap-2'>
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<div className='flex items-center gap-1 text-muted-foreground text-xs'>
							<User2 className='h-3 w-3' />
							<span>{entity.parent_id ? 1 : 0}</span>
						</div>
					</TooltipTrigger>
					<TooltipContent side='top'>
						{entity.parent_id ? '1 parent' : '0 parents'}
					</TooltipContent>
				</Tooltip>
				{config.showTypeBadge && config.typeBadgeLabel && (
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1 text-muted-foreground text-xs'>
								<FileText className='h-3 w-3' />
								<span>{config.typeBadgeLabel}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='top'>
							This is a {config.typeBadgeLabel}
						</TooltipContent>
					</Tooltip>
				)}
				<div className='flex-1' />
				{/* Leaving soon badge */}
				{showLeavingSoon && isLeavingSoon && thresholdInfo && (
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<Badge className='h-5 text-xs' variant='destructive'>
								leaving soon
							</Badge>
						</TooltipTrigger>
						<TooltipContent side='top'>
							{config.getLeavingSoonTooltip(
								thresholdInfo.daysUntil,
								bucketInfo.label
							)}
						</TooltipContent>
					</Tooltip>
				)}
				{/* SRS toggle */}
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<div
							className={config.isUpdating ? 'opacity-50' : 'cursor-pointer'}
							onClick={handleSrsToggle}
							onKeyDown={e => e.stopPropagation()}
						>
							{(entity.srs_enabled ?? true) ? (
								<BookOpen className='h-4 w-4 text-green-500' />
							) : (
								<BookOpenOff className='h-4 w-4 text-muted-foreground' />
							)}
						</div>
					</TooltipTrigger>
					<TooltipContent side='top'>Surface in review page</TooltipContent>
				</Tooltip>
				<div className='flex items-center gap-1'>{headerRight}</div>
			</CardHeader>

			<CardContent className='mb-3 flex flex-1 flex-col gap-3'>
				<div className='flex flex-col gap-1'>
					{/* Inbox/Archive indicators */}
					{(entity.inboxed || entity.archived) && (
						<div className='flex items-center gap-2 text-muted-foreground text-xs'>
							{entity.inboxed && (
								<div className='flex items-center gap-1'>
									<Inbox className='h-3 w-3' />
									<span>Inboxed</span>
								</div>
							)}
							{entity.archived && (
								<div className='flex items-center gap-1'>
									<Archive className='h-3 w-3' />
									<span>Archived</span>
								</div>
							)}
						</div>
					)}

					<div className='flex flex-col gap-0.5'>
						{highlightedPrimary && (
							<h3 className='break-word line-clamp-5 font-semibold leading-tight [overflow-wrap:anywhere]'>
								{highlightedPrimary}
							</h3>
						)}
						{highlightedNotes && (
							<p className='break-word line-clamp-[8] text-sm [overflow-wrap:anywhere]'>
								{highlightedNotes}
							</p>
						)}
					</div>
				</div>
			</CardContent>

			{/* Bottom row: Status info and Children */}
			<CardFooter className='gap-1 text-muted-foreground text-xs'>
				{isUnreviewed ? (
					<div className='flex items-center gap-1'>
						<Sparkles className='h-3 w-3' />
						<span>Unreviewed</span>
					</div>
				) : (
					<>
						{/* Bucket with tooltip */}
						{bucketInfo.tooltip ? (
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<div className='flex items-center gap-1'>
										<BookOpen className='h-3 w-3' />
										<span>
											{bucketInfo.label}
											{bucketInfo.days !== null &&
												bucketInfo.suffix === 'ago' &&
												` (${bucketInfo.days}d ${bucketInfo.suffix})`}
										</span>
									</div>
								</TooltipTrigger>
								<TooltipContent side='top'>{bucketInfo.tooltip}</TooltipContent>
							</Tooltip>
						) : (
							<span>{bucketInfo.label}</span>
						)}
						{/* Retrievability */}
						{retrievabilityDisplay && (
							<>
								<span>·</span>
								<Tooltip>
									<TooltipTrigger asChild={true}>
										<div className='flex items-center gap-1'>
											<Brain className='h-3 w-3' />
											<span>{retrievabilityDisplay}</span>
										</div>
									</TooltipTrigger>
									<TooltipContent side='top'>
										{retrievabilityDisplay} chance of successfully recalling
										today
									</TooltipContent>
								</Tooltip>
							</>
						)}
						{/* Last reviewed */}
						<span>·</span>
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<div className='flex items-center gap-1'>
									<Calendar className='h-3 w-3' />
									<span>{lastReviewed.text}</span>
								</div>
							</TooltipTrigger>
							<TooltipContent side='top'>
								Last reviewed {lastReviewed.tooltipText}
							</TooltipContent>
						</Tooltip>
					</>
				)}
				<div className='flex-1' />
				{/* Children count */}
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<div className='flex items-center gap-1'>
							<Baby className='h-3 w-3' />
							<span>{entity.children_count ?? 0}</span>
						</div>
					</TooltipTrigger>
					<TooltipContent side='top'>
						{config.getChildrenLabel(entity.children_count ?? 0)}
					</TooltipContent>
				</Tooltip>
			</CardFooter>
		</Card>
	)
}
