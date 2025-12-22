import { Calendar, Gauge, GaugeCircle } from 'lucide-react'
import { useMemo } from 'react'
import { getDateColor, getDueDateDisplay } from '~/utils/dueDate'
import {
	formatRetrievability,
	getRetrievabilityColor
} from '~/utils/retrievability'

interface TopicDateDisplayProps {
	retrievability: number | null
	scheduledAt?: string | null
	srsEnabled: boolean
	className?: string
}

export function TopicDateDisplay({
	retrievability,
	scheduledAt = null,
	srsEnabled,
	className
}: TopicDateDisplayProps) {
	const nextScheduledDisplay = useMemo(
		() => (scheduledAt ? getDueDateDisplay(scheduledAt) : null),
		[scheduledAt]
	)

	const scheduledColor = useMemo(
		() => getDateColor(nextScheduledDisplay?.displayText ?? null),
		[nextScheduledDisplay?.displayText]
	)

	const retrievabilityColor = useMemo(
		() => getRetrievabilityColor(retrievability, srsEnabled),
		[retrievability, srsEnabled]
	)

	const retrievabilityText = useMemo(
		() => formatRetrievability(retrievability),
		[retrievability]
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
					<Gauge className={`h-3 w-3 ${retrievabilityColor}`} />
				) : (
					<GaugeCircle className={`h-3 w-3 ${retrievabilityColor}`} />
				)}
				<span className={`text-xs ${retrievabilityColor}`}>
					{retrievabilityText}
				</span>
			</div>
		</div>
	)
}
