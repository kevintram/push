import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Anvil, CalendarIcon, File, MoreHorizontal, Trash } from 'lucide-react'
import {
	type KeyboardEvent,
	type MouseEvent,
	useCallback,
	useState
} from 'react'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { useDeleteReview } from '../api/deleteReview'
import { useUpdateReview } from '../api/updateReview'
import { usePrefetchReviewDetail } from '../hooks/usePrefetchReviewDetail'
import type { ReviewListItem } from '../types/review.types'
import { isOverdue } from '../utils/isOverdue'
import { DatePickerDropdown } from './DatePickerDropdown'
import { getReviewListGridCols } from './ReviewListHeader'
import {
	ReviewRatingCheckbox,
	type ReviewRatingState
} from './ReviewRatingCheckbox'

const getInitialSelectedDate = (entry: ReviewListItem) => {
	if (entry.completed_at) {
		return dayjs(entry.completed_at).toDate()
	}
	if (entry.scheduled_at) {
		return dayjs(entry.scheduled_at).toDate()
	}
	return null
}

const getStabilityChangeColorClass = (
	before: number | null,
	after: number | null
) => {
	if (after == null) {
		return ''
	}
	if (before == null) {
		return 'text-green-600 dark:text-green-400'
	}
	const roundedDelta = Math.round(after - before)
	if (roundedDelta >= 0) {
		return 'text-green-600 dark:text-green-400'
	}
	return 'text-red-600 dark:text-red-400'
}

interface ReviewItemProps {
	dateFormat?: 'relative' | 'short'
	entry: ReviewListItem
	onReviewClick?: (reviewId: number) => void
	readonly?: boolean
	showCardColumn?: boolean
	variant?: 'default' | 'topic'
}

export function ReviewItem({
	dateFormat = 'relative',
	entry,
	onReviewClick,
	readonly = false,
	showCardColumn = true,
	variant = 'default'
}: ReviewItemProps) {
	const navigate = useNavigate()
	const [openDatePicker, setOpenDatePicker] = useState<
		'compact' | 'wide' | null
	>(null)
	const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
		getInitialSelectedDate(entry)
	)

	const updateReviewMutation = useUpdateReview()
	const deleteReviewMutation = useDeleteReview()
	const {
		cancelReviewDetailPreload,
		scheduleReviewDetailPreload,
		seedReviewDetail
	} = usePrefetchReviewDetail(entry)

	const isCompleted = entry.completed_at != null
	const reviewStatus: ReviewRatingState = isCompleted
		? (entry.rating ?? 'good')
		: 'uncompleted'

	const stabilityChangeColorClass = getStabilityChangeColorClass(
		entry.stability_before,
		entry.stability_after
	)
	const hasStability = entry.stability_after != null
	const hasDelta =
		entry.stability_after != null && entry.stability_before != null
	const stabilityAfterRounded = hasStability
		? Math.round(entry.stability_after ?? 0)
		: 0
	const stabilityDeltaRounded = hasDelta
		? Math.round((entry.stability_after ?? 0) - (entry.stability_before ?? 0))
		: 0

	const handleStatusChange = useCallback(
		(status: ReviewRatingState) => {
			if (!entry.id) return
			if (status === 'uncompleted') {
				updateReviewMutation.mutateAsync({
					id: entry.id,
					rating: null,
					completed_at: null
				})
				return
			}
			updateReviewMutation.mutateAsync({
				id: entry.id,
				rating: status,
				completed_at: entry.completed_at ?? dayjs().format('YYYY-MM-DD')
			})
		},
		[entry.id, entry.completed_at, updateReviewMutation]
	)

	const handleDateSave = useCallback(
		(newDate: Date | null) => {
			setSelectedDate(newDate)
			if (!entry.id) {
				setOpenDatePicker(null)
				return
			}
			const newDateString = newDate ? dayjs(newDate).format('YYYY-MM-DD') : null
			if (entry.completed_at) {
				updateReviewMutation.mutateAsync({
					id: entry.id,
					completed_at: newDateString
				})
			} else {
				updateReviewMutation.mutateAsync({
					id: entry.id,
					scheduled_at: newDateString
				})
			}
			setOpenDatePicker(null)
		},
		[entry.id, entry.completed_at, updateReviewMutation]
	)

	const handleDelete = useCallback(async () => {
		if (!entry.id) return
		await deleteReviewMutation.mutateAsync(entry.id)
	}, [deleteReviewMutation, entry.id])

	const handleReviewClick = useCallback(() => {
		if (readonly) return
		if (entry.id) {
			seedReviewDetail()
			onReviewClick?.(entry.id)
		}
	}, [entry.id, onReviewClick, readonly, seedReviewDetail])

	const handleRowKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (readonly) return
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				handleReviewClick()
			}
		},
		[handleReviewClick, readonly]
	)

	const handleIntentStart = useCallback(() => {
		if (readonly) return
		scheduleReviewDetailPreload()
	}, [readonly, scheduleReviewDetailPreload])

	const handleIntentEnd = useCallback(() => {
		cancelReviewDetailPreload()
	}, [cancelReviewDetailPreload])

	const handleReviewCardClick = useCallback(
		(event: MouseEvent) => {
			event.stopPropagation()
			if (!entry.review_card) return
			navigate({
				to: '/review-cards/$reviewCardId',
				params: { reviewCardId: entry.review_card.id.toString() },
				search: { tab: 'reviews' }
			})
		},
		[navigate, entry.review_card]
	)
	const effectiveDate = entry.effective_date
		? dayjs(entry.effective_date).toDate()
		: null

	const isOverdueValue = isOverdue({
		scheduled_at: entry.scheduled_at,
		isCompleted
	})

	const relativeDate = formatRelativeDate(effectiveDate, {
		shortDate: dateFormat === 'short'
	})

	const dateTooltipText = effectiveDate
		? dayjs(effectiveDate).format('MMM D, YYYY')
		: null

	const dateButtonColorClass = cn(
		isOverdueValue && 'text-red-600 dark:text-red-400',
		!isOverdueValue &&
			relativeDate.text === 'Today' &&
			'text-blue-600 dark:text-blue-400'
	)
	const description = entry.description?.trim()

	const gridCols = getReviewListGridCols(showCardColumn)
	// --- Shared element JSX ---

	const checkboxEl = (
		<ReviewRatingCheckbox
			disabled={readonly || updateReviewMutation.isPending}
			invalid={isOverdueValue}
			onChange={handleStatusChange}
			value={reviewStatus}
		/>
	)

	const hasNotes = !!entry.notes?.trim()

	const descriptionEl = (
		<span
			className={cn(
				'flex min-w-0 items-center gap-1.5 text-sm',
				description ? 'text-foreground' : 'text-muted-foreground'
			)}
		>
			<span className='truncate'>{description || 'No description'}</span>
			{hasNotes && <File className='h-3 w-3 shrink-0 text-muted-foreground' />}
		</span>
	)

	const compactDateEl = (
		<Tooltip>
			<TooltipTrigger
				render={
					<DatePickerDropdown
						disabled={readonly}
						isOpen={openDatePicker === 'compact'}
						onDateChange={handleDateSave}
						onOpenChange={open => setOpenDatePicker(open ? 'compact' : null)}
						selectedDate={selectedDate}
						trigger={
							<Button
								className={cn(
									'!px-0 h-auto text-xs',
									readonly && 'cursor-default opacity-50',
									dateButtonColorClass
								)}
								disabled={readonly}
								onClick={e => e.stopPropagation()}
								size='sm'
								variant='link'
							>
								<CalendarIcon className='h-3 w-3' />
								{relativeDate.text}
							</Button>
						}
					/>
				}
			/>
			{dateTooltipText && <TooltipContent>{dateTooltipText}</TooltipContent>}
		</Tooltip>
	)

	const wideDateEl = (
		<Tooltip>
			<TooltipTrigger
				render={
					<DatePickerDropdown
						disabled={readonly}
						isOpen={openDatePicker === 'wide'}
						onDateChange={handleDateSave}
						onOpenChange={open => setOpenDatePicker(open ? 'wide' : null)}
						selectedDate={selectedDate}
						trigger={
							<Button
								className={cn(
									'!px-0 h-auto text-foreground text-sm hover:text-foreground',
									readonly && 'cursor-default opacity-50',
									dateButtonColorClass
								)}
								disabled={readonly}
								onClick={e => e.stopPropagation()}
								size='sm'
								variant='link'
							>
								<CalendarIcon className='h-3 w-3' />
								{relativeDate.text}
							</Button>
						}
					/>
				}
			/>
			{dateTooltipText && <TooltipContent>{dateTooltipText}</TooltipContent>}
		</Tooltip>
	)

	const moreButtonEl = !readonly && (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						className='h-6 w-6 p-0'
						onClick={e => e.stopPropagation()}
						size='sm'
						title='More options'
						variant='ghost'
					>
						<MoreHorizontal className='h-3 w-3' />
					</Button>
				}
			/>
			<DropdownMenuContent align='end' side='bottom' sideOffset={4}>
				<DropdownMenuItem
					onClick={e => {
						e.stopPropagation()
						handleDelete()
					}}
				>
					<Trash className='mr-2 h-4 w-4' />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)

	const cardInfo = (() => {
		if (!showCardColumn) return null
		if (variant !== 'default' && variant !== 'topic') return null
		if (entry.review_card) {
			return {
				label: entry.review_card.prompt || 'Untitled card',
				onClick: handleReviewCardClick
			}
		}
		return {
			label: 'Unknown card',
			onClick: handleReviewCardClick
		}
	})()

	const durabilityCompactEl = hasStability && (
		<div className='flex items-center text-muted-foreground text-xs'>
			<Anvil className='mr-1 h-3 w-3' />
			<span>{`${stabilityAfterRounded}d`}</span>
			{hasDelta ? (
				<span className={cn('ml-1', stabilityChangeColorClass)}>
					({stabilityDeltaRounded >= 0 ? '+' : ''}
					{stabilityDeltaRounded})
				</span>
			) : (
				<span className={cn('ml-1', stabilityChangeColorClass)}>(new)</span>
			)}
		</div>
	)

	const durabilityWideEl = hasStability && (
		<span className='flex items-center truncate text-foreground text-sm'>
			<Anvil className='mr-1 h-3 w-3 shrink-0' />
			{`${stabilityAfterRounded}d`}
			{hasDelta ? (
				<span className={cn('ml-1', stabilityChangeColorClass)}>
					({stabilityDeltaRounded >= 0 ? '+' : ''}
					{stabilityDeltaRounded})
				</span>
			) : (
				<span className={cn('ml-1', stabilityChangeColorClass)}>(new)</span>
			)}
		</span>
	)

	return (
		// biome-ignore lint/nursery/noNoninteractiveElementInteractions: row container supports keyboard navigation and cannot be a button due to nested controls
		// biome-ignore lint/a11y/noStaticElementInteractions: interactive row behavior is intentional for review list ergonomics
		<div
			className={cn(
				'rounded-md px-2 py-2',
				readonly ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50'
			)}
			onBlur={handleIntentEnd}
			onClick={handleReviewClick}
			onFocus={handleIntentStart}
			onKeyDown={handleRowKeyDown}
			onMouseEnter={handleIntentStart}
			onMouseLeave={handleIntentEnd}
			tabIndex={readonly ? -1 : 0}
		>
			{/* Compact layout (default, hidden at wide) */}
			<div className='flex @lg/review-list:hidden flex-col'>
				<div className='flex items-start gap-2'>
					<div className='pt-0.5'>{checkboxEl}</div>
					<div className='min-w-0 flex-1'>
						{descriptionEl}
						<div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs'>
							{compactDateEl}
							{cardInfo && (
								<Button
									className='!px-0 h-auto min-w-0 max-w-full justify-start text-muted-foreground text-xs hover:text-foreground'
									onClick={cardInfo.onClick}
									size='sm'
									variant='link'
								>
									<span className='truncate'>{cardInfo.label}</span>
								</Button>
							)}
							{hasStability ? durabilityCompactEl : null}
						</div>
					</div>
					{moreButtonEl ? <div className='shrink-0'>{moreButtonEl}</div> : null}
				</div>
			</div>

			{/* Wide/table layout (hidden by default, shown at @lg) */}
			<div
				className={`@lg/review-list:grid hidden ${gridCols} items-center gap-x-3`}
			>
				<div>{checkboxEl}</div>
				{descriptionEl}
				{durabilityWideEl || <span />}
				{showCardColumn &&
					(cardInfo ? (
						<Button
							className='!px-0 h-auto min-w-0 justify-start text-foreground text-sm hover:text-foreground'
							onClick={cardInfo.onClick}
							size='sm'
							variant='link'
						>
							<span className='truncate'>{cardInfo.label}</span>
						</Button>
					) : (
						<span />
					))}
				<div>{wideDateEl}</div>
				<div className='flex justify-center'>{moreButtonEl}</div>
			</div>
		</div>
	)
}
