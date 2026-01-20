import { useQueryClient } from '@tanstack/react-query'
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
import type { KeyboardEvent, MouseEvent } from 'react'
import { useCallback, useMemo } from 'react'
import { BookOpenOff } from '~/components/icons'
import { Badge } from '~/components/ui/Badge'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/Card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'
import { sourceKeys } from '../api/queryKeys'
import { useUpdateSource } from '../api/updateSource'
import type { Source } from '../types/source.types'

const MIN_HEIGHT = 96

interface SourceCardProps {
	source: Source
	onSourceClick?: (source: Source) => void
	minHeight?: number
	searchQuery?: string
	headerRight?: React.ReactNode
	/** Whether to show the "leaving soon" badge in the header. Defaults to false. */
	showLeavingSoon?: boolean
}

export function SourceCard({
	source,
	onSourceClick,
	minHeight = MIN_HEIGHT,
	searchQuery,
	headerRight,
	showLeavingSoon = false
}: SourceCardProps) {
	const queryClient = useQueryClient()
	const { mutate: updateSource, isPending: isUpdatingSource } =
		useUpdateSource()

	// Compute simple metrics
	const isUnreviewed = source.last_reviewed_at === null
	const isLeavingSoon =
		source.days_until_threshold !== null && source.days_until_threshold <= 2
	const retrievabilityDisplay =
		source.retrievability !== null
			? `${Math.round(source.retrievability * 100)}%`
			: null

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(source.last_reviewed_at, {
				includeFuture: false,
				nullLabel: 'never'
			}),
		[source.last_reviewed_at]
	)

	// Bucket info for display
	const bucketInfo = useMemo(() => {
		if (!source.bucket) return null
		const labels: Record<string, string> = {
			LATE: 'Late',
			ON_TIME: 'Ready',
			EARLY: 'Early'
		}
		return {
			label: labels[source.bucket] || source.bucket,
			days: source.days_until_threshold
		}
	}, [source.bucket, source.days_until_threshold])

	// Search highlighting
	const highlightedTitle = useMemo(() => {
		if (!source.title) return null
		if (!searchQuery?.trim()) return source.title
		return highlightText({ text: source.title, query: searchQuery })
	}, [source.title, searchQuery])

	const highlightedNotes = useMemo(() => {
		if (!source.notes) return null
		if (!searchQuery?.trim()) return source.notes
		return truncateWithHighlight(source.notes, searchQuery, 200)
	}, [source.notes, searchQuery])

	const handleActivate = useCallback(() => {
		onSourceClick?.(source)
	}, [onSourceClick, source])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onSourceClick?.(source)
			}
		},
		[onSourceClick, source]
	)

	const handleMouseEnter = useCallback(() => {
		// Prefetch source details
		queryClient.prefetchQuery({
			queryKey: sourceKeys.detail(source.id),
			staleTime: 30_000
		})
	}, [queryClient, source.id])

	const handleSrsToggle = useCallback(
		(e: MouseEvent) => {
			e.stopPropagation()
			updateSource({
				id: source.id,
				srs_enabled: !source.srs_enabled
			})
		},
		[updateSource, source.id, source.srs_enabled]
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
							<span>{source.parent_id ? 1 : 0}</span>
						</div>
					</TooltipTrigger>
					<TooltipContent side='top'>
						{source.parent_id ? '1 parent' : '0 parents'}
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<div className='flex items-center gap-1 text-muted-foreground text-xs'>
							<FileText className='h-3 w-3' />
							<span>Source</span>
						</div>
					</TooltipTrigger>
					<TooltipContent side='top'>This is a Source</TooltipContent>
				</Tooltip>
				<div className='flex-1' />
				{/* Leaving soon badge */}
				{showLeavingSoon &&
					isLeavingSoon &&
					source.days_until_threshold !== null && (
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<Badge className='h-5 text-xs' variant='destructive'>
									leaving soon
								</Badge>
							</TooltipTrigger>
							<TooltipContent side='top'>
								{source.days_until_threshold === 1
									? '1 day until ready'
									: `${source.days_until_threshold} days until ready`}
							</TooltipContent>
						</Tooltip>
					)}
				{/* SRS toggle */}
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<div
							className={isUpdatingSource ? 'opacity-50' : 'cursor-pointer'}
							onClick={handleSrsToggle}
							onKeyDown={e => e.stopPropagation()}
						>
							{(source.srs_enabled ?? true) ? (
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
					{(source.inboxed || source.archived) && (
						<div className='flex items-center gap-2 text-muted-foreground text-xs'>
							{source.inboxed && (
								<div className='flex items-center gap-1'>
									<Inbox className='h-3 w-3' />
									<span>Inboxed</span>
								</div>
							)}
							{source.archived && (
								<div className='flex items-center gap-1'>
									<Archive className='h-3 w-3' />
									<span>Archived</span>
								</div>
							)}
						</div>
					)}

					<div className='flex flex-col gap-0.5'>
						{highlightedTitle && (
							<h3 className='break-word line-clamp-5 font-semibold leading-tight [overflow-wrap:anywhere]'>
								{highlightedTitle}
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
						{/* Bucket */}
						{bucketInfo && (
							<div className='flex items-center gap-1'>
								<BookOpen className='h-3 w-3' />
								<span>{bucketInfo.label}</span>
							</div>
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
							<span>{source.children_count ?? 0}</span>
						</div>
					</TooltipTrigger>
					<TooltipContent side='top'>
						{source.children_count === 1
							? '1 child source'
							: `${source.children_count ?? 0} child sources`}
					</TooltipContent>
				</Tooltip>
			</CardFooter>
		</Card>
	)
}
