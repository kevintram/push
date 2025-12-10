import dayjs from 'dayjs'
import { Calendar, Flag, FlagOff, FlagTriangleRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger
} from '~/components/ui/HoverCard'
import { getDateColor, getRelativeDateDisplay } from '~/utils/dueDate'

interface DueDateHoverCardProps {
	due: string | null
	scheduledAt?: string | null
	srsEnabled: boolean
	className?: string
	children?: ReactNode
}

export function DueDateHoverCard({
	due,
	scheduledAt = null,
	srsEnabled,
	className,
	children
}: DueDateHoverCardProps) {
	const dueDateDisplay = useMemo(() => getRelativeDateDisplay(due), [due])
	const nextScheduledDisplay = useMemo(
		() => getRelativeDateDisplay(scheduledAt),
		[scheduledAt]
	)

	const dueDateColor = useMemo(
		() => getDateColor(dueDateDisplay?.displayText ?? null, srsEnabled),
		[dueDateDisplay?.displayText, srsEnabled]
	)

	const scheduledColor = useMemo(
		() => getDateColor(nextScheduledDisplay?.displayText ?? null),
		[nextScheduledDisplay?.displayText]
	)

	const defaultTrigger = (
		<div className={`flex items-center gap-1 ${className ?? ''}`}>
			{nextScheduledDisplay && (
				<div className='flex items-center gap-1'>
					<Calendar className={`h-3 w-3 ${scheduledColor}`} />
					<span className={`text-xs ${scheduledColor}`}>
						{nextScheduledDisplay.displayText}
					</span>
					<span className='text-muted-foreground text-xs'>
						·
					</span>
				</div>
			)}
			<div className='flex items-center gap-1'>
				{
					srsEnabled ? (
						<Flag className={`h-3 w-3 ${dueDateColor}`} />
					) : (
						<FlagOff className={`h-3 w-3 ${dueDateColor}`} />
					)
				}
				<span className={`text-xs ${dueDateColor}`}>
					{dueDateDisplay ? dueDateDisplay.displayText : 'None'}
				</span>
			</div>
		</div>
	)

	return (
		<HoverCard openDelay={300}>
			<HoverCardTrigger
				asChild={true}
				onClick={e => {
					e.stopPropagation()
				}}
				onPointerDown={e => {
					e.stopPropagation()
				}}
			>
				{children ?? defaultTrigger}
			</HoverCardTrigger>
			<HoverCardContent className='w-auto p-3' side='bottom'>
				<div className='flex flex-col gap-2'>
					<div className='flex flex-col gap-1'>
						<div className='font-semibold text-sm'>
							{dueDateDisplay
								? `Due on ${dayjs(dueDateDisplay.dueDate).format('MMMM D, YYYY')}`
								: 'No due date set'}
						</div>
						<p className='text-muted-foreground text-xs'>
							{srsEnabled ? 'SRS Enabled' : 'SRS Disabled'}
						</p>
					</div>
					<div className='flex flex-col gap-1'>
						<div className='font-semibold text-sm'>
							{nextScheduledDisplay
								? `Next scheduled on ${dayjs(nextScheduledDisplay.dueDate).format('MMMM D, YYYY')}`
								: 'No review scheduled'}
						</div>
						{nextScheduledDisplay && (
							<p className='text-muted-foreground text-xs'>
								Scheduled {nextScheduledDisplay.displayText}
							</p>
						)}
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	)
}
