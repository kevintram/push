import { useQueryClient } from '@tanstack/react-query'
import {
	Archive,
	BookOpen,
	Brain,
	Calendar,
	FileText,
	Inbox,
	Layers,
	Sparkles
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
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'
import { practiceKeys } from '../api/queryKeys'
import { useUpdatePractice } from '../api/updatePractice'
import type { Practice } from '../types/practice.types'

const MIN_HEIGHT = 96

interface PracticeCardProps {
	practice: Practice
	onPracticeClick?: (practice: Practice) => void
	minHeight?: number
	searchQuery?: string
	headerRight?: ReactNode
	/** Whether to show the "leaving soon" badge in the header. Defaults to false. */
	showLeavingSoon?: boolean
}

export function PracticeCard({
	practice,
	onPracticeClick,
	minHeight = MIN_HEIGHT,
	searchQuery,
	headerRight,
	showLeavingSoon = false
}: PracticeCardProps) {
	const queryClient = useQueryClient()
	const { mutate: updatePractice, isPending: isUpdating } = useUpdatePractice()
	const metrics = useLearnableMetrics(practice)

	const {
		bucketInfo,
		isUnreviewed,
		isLeavingSoon,
		retrievabilityDisplay,
		thresholdInfo
	} = metrics

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(practice.last_reviewed_at, {
				includeFuture: false,
				nullLabel: 'never'
			}),
		[practice.last_reviewed_at]
	)

	// Search highlighting
	const highlightedPrompt = useMemo(() => {
		if (!practice.prompt) return null
		if (!searchQuery?.trim()) return practice.prompt
		return highlightText({ text: practice.prompt, query: searchQuery })
	}, [practice.prompt, searchQuery])

	const highlightedAnswer = useMemo(() => {
		if (!practice.answer) return null
		if (!searchQuery?.trim()) return practice.answer
		return truncateWithHighlight(practice.answer, searchQuery, 200)
	}, [practice.answer, searchQuery])

	const handleActivate = useCallback(() => {
		onPracticeClick?.(practice)
	}, [onPracticeClick, practice])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onPracticeClick?.(practice)
			}
		},
		[onPracticeClick, practice]
	)

	const handleMouseEnter = useCallback(() => {
		queryClient.prefetchQuery({
			queryKey: practiceKeys.detail(practice.id),
			staleTime: 30_000
		})
	}, [queryClient, practice.id])

	const handleSrsToggle = useCallback(
		(e: MouseEvent) => {
			e.stopPropagation()
			updatePractice({ id: practice.id, srs_enabled: !practice.srs_enabled })
		},
		[updatePractice, practice.id, practice.srs_enabled]
	)

	const totalRelations =
		(practice.topics_count ?? 0) + (practice.sources_count ?? 0)

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
				{/* Type badge */}
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<div className='flex items-center gap-1 text-muted-foreground text-xs'>
							<FileText className='h-3 w-3' />
							<span>Practice</span>
						</div>
					</TooltipTrigger>
					<TooltipContent side='top'>This is a Practice</TooltipContent>
				</Tooltip>
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
							{thresholdInfo.daysUntil === 1
								? `1 day until ${bucketInfo.label === 'Early' ? 'ready' : 'late'}`
								: `${thresholdInfo.daysUntil} days until ${bucketInfo.label === 'Early' ? 'ready' : 'late'}`}
						</TooltipContent>
					</Tooltip>
				)}
				{/* SRS toggle */}
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<div
							className={isUpdating ? 'opacity-50' : 'cursor-pointer'}
							onClick={handleSrsToggle}
							onKeyDown={e => e.stopPropagation()}
						>
							{(practice.srs_enabled ?? true) ? (
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
					{(practice.inboxed || practice.archived) && (
						<div className='flex items-center gap-2 text-muted-foreground text-xs'>
							{practice.inboxed && (
								<div className='flex items-center gap-1'>
									<Inbox className='h-3 w-3' />
									<span>Inboxed</span>
								</div>
							)}
							{practice.archived && (
								<div className='flex items-center gap-1'>
									<Archive className='h-3 w-3' />
									<span>Archived</span>
								</div>
							)}
						</div>
					)}

					<div className='flex flex-col gap-0.5'>
						{/* Prompt as primary text */}
						{highlightedPrompt && (
							<h3 className='break-word line-clamp-5 font-semibold leading-tight [overflow-wrap:anywhere]'>
								{highlightedPrompt}
							</h3>
						)}
						{/* Answer as secondary text */}
						{highlightedAnswer && (
							<p className='break-word line-clamp-[8] text-muted-foreground text-sm [overflow-wrap:anywhere]'>
								{highlightedAnswer}
							</p>
						)}
					</div>
				</div>
			</CardContent>

			{/* Bottom row: Status info and Relations */}
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
				{/* Relations count (topics + sources) */}
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<div className='flex items-center gap-1'>
							<Layers className='h-3 w-3' />
							<span>{totalRelations}</span>
						</div>
					</TooltipTrigger>
					<TooltipContent side='top'>
						{practice.topics_count ?? 0} topic
						{(practice.topics_count ?? 0) !== 1 ? 's' : ''},{' '}
						{practice.sources_count ?? 0} source
						{(practice.sources_count ?? 0) !== 1 ? 's' : ''}
					</TooltipContent>
				</Tooltip>
			</CardFooter>
		</Card>
	)
}
