import { Calendar, Flag, FlagOff } from 'lucide-react'
import { useMemo } from 'react'
import { getDateColor, getDueDateDisplay } from '~/utils/dueDate'

interface TopicDateDisplayProps {
	due: string | null
	scheduledAt?: string | null
	srsEnabled: boolean
	className?: string
}

export function TopicDateDisplay({
	due,
	scheduledAt = null,
	srsEnabled,
	className
}: TopicDateDisplayProps) {
	const dueDateDisplay = useMemo(
		() => (due ? getDueDateDisplay(due) : null),
		[due]
	)
	const nextScheduledDisplay = useMemo(
		() => (scheduledAt ? getDueDateDisplay(scheduledAt) : null),
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

	return (
		<div className={`flex items-center gap-1 ${className ?? ''}`}>
			{nextScheduledDisplay && (
				<div className='flex items-center gap-1'>
					<Calendar className={`h-3 w-3 ${scheduledColor}`} />
					<span className={`text-xs ${scheduledColor}`}>
						{nextScheduledDisplay.displayText}
					</span>
					<span className='text-muted-foreground text-xs'>·</span>
				</div>
			)}
			<div className='flex items-center gap-1'>
				{srsEnabled ? (
					<Flag className={`h-3 w-3 ${dueDateColor}`} />
				) : (
					<FlagOff className={`h-3 w-3 ${dueDateColor}`} />
				)}
				<span className={`text-xs ${dueDateColor}`}>
					{dueDateDisplay ? dueDateDisplay.displayText : 'None'}
				</span>
			</div>
		</div>
	)
}
