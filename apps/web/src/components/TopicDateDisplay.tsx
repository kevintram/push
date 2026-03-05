import { Calendar, Gauge } from 'lucide-react'
import { useMemo } from 'react'
import type { FreshnessTier } from '~/models/learnable.types'
import { getDateColor, getDueDateDisplay } from '~/utils/dueDate'
import {
	formatRetrievability,
	getFreshnessTierColor
} from '~/utils/retrievability'

interface TopicDateDisplayProps {
	freshnessTier: FreshnessTier | null
	retrievability: number | null
	scheduledAt?: string | null
	className?: string
}

export function TopicDateDisplay({
	freshnessTier,
	retrievability,
	scheduledAt = null,
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

	const tierColor = useMemo(
		() => getFreshnessTierColor(freshnessTier),
		[freshnessTier]
	)

	const tierLabel = freshnessTier ?? '—'

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
				<Gauge className={`h-3 w-3 ${tierColor}`} />
				<span className={`text-xs ${tierColor}`} title={retrievabilityText}>
					{tierLabel}
				</span>
			</div>
		</div>
	)
}
