import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import {
	Anvil,
	CalendarIcon,
	Dumbbell,
	File,
	FileText,
	MoreHorizontal,
	StickyNote,
	Trash
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { isOverdue } from '~/features/topics/utils/isOverdue'
import { cn } from '~/lib/utils'
import { formatRelativeDate } from '~/utils/formatRelativeDate'
import { useDeleteReview } from '../api/deleteReview'
import { useUpdateReview } from '../api/updateReview'
import type { ReviewListItem } from '../types/review.types'
import { DatePickerDropdown } from './DatePickerDropdown'
import { REVIEW_LIST_GRID_COLS } from './ReviewListHeader'
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
	variant?: 'default' | 'topic'
}

export function ReviewItem({
	dateFormat = 'relative',
	entry,
	onReviewClick,
	readonly = false,
	variant = 'default'
}: ReviewItemProps) {
	const navigate = useNavigate()
	const [isDateOpen, setIsDateOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
		getInitialSelectedDate(entry)
	)

	const updateReviewMutation = useUpdateReview()
	const deleteReviewMutation = useDeleteReview()

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
				setIsDateOpen(false)
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
			setIsDateOpen(false)
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
			onReviewClick?.(entry.id)
		}
	}, [entry.id, onReviewClick, readonly])

	const handleTopicClick = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation()
			if (!entry.topic) return
			navigate({
				to: '/topics/$topicId/reviews',
				params: { topicId: entry.topic.id.toString() }
			})
		},
		[navigate, entry.topic]
	)

	const handleSourceClick = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation()
			if (!entry.source) return
			navigate({
				to: '/sources/$sourceId/reviews',
				params: { sourceId: entry.source.id.toString() }
			})
		},
		[navigate, entry.source]
	)

	const handlePracticeClick = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation()
			if (!entry.practice) return
			navigate({
				to: '/practices/$practiceId/reviews',
				params: { practiceId: entry.practice.id.toString() }
			})
		},
		[navigate, entry.practice]
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

	const dateButtonColorClass = cn(
		isOverdueValue && 'text-red-600 dark:text-red-400',
		!isOverdueValue &&
			relativeDate.text === 'Today' &&
			'text-blue-600 dark:text-blue-400'
	)
	const description = entry.description?.trim()

	// Determine if we're actually rendering an entity link
	const showingEntity =
		(variant === 'default' || variant === 'topic') &&
		(entry.topic?.name || entry.source?.title || entry.practice?.prompt)

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
		<DatePickerDropdown
			disabled={readonly}
			isOpen={isDateOpen}
			onDateChange={handleDateSave}
			onOpenChange={setIsDateOpen}
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
	)

	const wideDateEl = (
		<DatePickerDropdown
			disabled={readonly}
			isOpen={isDateOpen}
			onDateChange={handleDateSave}
			onOpenChange={setIsDateOpen}
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

	// Entity display helper
	const entityInfo = (() => {
		if (variant !== 'default' && variant !== 'topic') return null
		if (entry.topic) {
			return {
				icon: <StickyNote className='h-3 w-3' />,
				label: entry.topic.name,
				onClick: handleTopicClick
			}
		}
		if (entry.source) {
			return {
				icon: <FileText className='h-3 w-3' />,
				label: entry.source.title,
				onClick: handleSourceClick
			}
		}
		if (entry.practice) {
			return {
				icon: <Dumbbell className='h-3 w-3' />,
				label: entry.practice.prompt,
				onClick: handlePracticeClick
			}
		}
		return null
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
		<div
			className={cn(
				'rounded-md px-2 py-2',
				readonly ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50'
			)}
			onClick={handleReviewClick}
		>
			{/* Compact layout (default, hidden at wide) */}
			<div className='flex @lg/review-list:hidden flex-col'>
				<div className='flex items-center gap-2 pb-1'>
					{checkboxEl}
					<span className='flex-1'>{descriptionEl}</span>
					{compactDateEl}
					{moreButtonEl}
				</div>
				<div className='flex items-center gap-1 text-muted-foreground text-xs'>
					{entityInfo && (
						<Button
							className='!px-0 h-auto text-muted-foreground text-xs hover:text-foreground'
							onClick={entityInfo.onClick}
							size='sm'
							variant='link'
						>
							<span>{entityInfo.label}</span>
						</Button>
					)}
					{hasStability && (
						<>
							{showingEntity && <span className='font-semibold'>⋅</span>}
							{durabilityCompactEl}
						</>
					)}
				</div>
			</div>

			{/* Wide/table layout (hidden by default, shown at @lg) */}
			<div
				className={`@lg/review-list:grid hidden ${REVIEW_LIST_GRID_COLS} items-center gap-x-3`}
			>
				<div>{checkboxEl}</div>
				{descriptionEl}
				{durabilityWideEl || <span />}
				{entityInfo ? (
					<Button
						className='!px-0 h-auto min-w-0 justify-start text-foreground text-sm hover:text-foreground'
						onClick={entityInfo.onClick}
						size='sm'
						variant='link'
					>
						<span className='truncate'>{entityInfo.label}</span>
					</Button>
				) : (
					<span />
				)}
				<div>{wideDateEl}</div>
				<div className='flex justify-center'>{moreButtonEl}</div>
			</div>
		</div>
	)
}
