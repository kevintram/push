import dayjs from 'dayjs'
import { Anvil, BookOpen, Brain, Sparkles } from 'lucide-react'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import type { TopicMetrics } from '../../hooks/useTopicMetrics'

interface TopicMetricsRowProps {
	metrics: TopicMetrics
	updatedAt: string
	insertedAt: string
}

export function TopicProperties({
	metrics,
	updatedAt,
	insertedAt
}: TopicMetricsRowProps) {
	const {
		isNewTopic,
		bucketInfo,
		retrievabilityDisplay,
		stabilityText,
		stabilityTooltipText
	} = metrics

	return (
		<div className='mb-3 flex items-center justify-start gap-2 font-semibold text-sm'>
			{isNewTopic ? (
				<div className='flex items-center gap-1'>
					<Sparkles className='h-3 w-3' />
					<span>New</span>
				</div>
			) : (
				<>
					{/* Bucket status */}
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
						<TooltipContent side='bottom'>
							{bucketInfo.tooltip ?? 'Complete a review to see status'}
						</TooltipContent>
					</Tooltip>
					<span>⋅</span>
					{/* Retrievability */}
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1'>
								<Brain className='h-3 w-3' />
								<span>{retrievabilityDisplay ?? '—'}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='bottom'>
							{retrievabilityDisplay
								? `${retrievabilityDisplay} chance of successfully recalling today`
								: 'Complete a review to calculate retrievability'}
						</TooltipContent>
					</Tooltip>
					<span>⋅</span>
					{/* Stability */}
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1'>
								<Anvil className='h-3 w-3' />
								<span>{stabilityText}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='bottom'>
							Durable for {stabilityTooltipText} without review
						</TooltipContent>
					</Tooltip>
				</>
			)}
			<span>⋅</span>
			{/* Edited date with edited AND created date in tooltip */}
			<Tooltip>
				<TooltipTrigger asChild={true}>
					<span>{dayjs(updatedAt).format('MMM D, YYYY')}</span>
				</TooltipTrigger>
				<TooltipContent side='bottom'>
					<div className='grid grid-cols-[auto_1fr] gap-x-2'>
						<span>Edited:</span>
						<span>{dayjs(updatedAt).format('MMM D, YYYY')}</span>
						<span>Created:</span>
						<span>{dayjs(insertedAt).format('MMM D, YYYY')}</span>
					</div>
				</TooltipContent>
			</Tooltip>
		</div>
	)
}
