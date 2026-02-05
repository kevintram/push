import dayjs from 'dayjs'
import { Anvil, Brain, Sparkles } from 'lucide-react'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import type { LearnableMetrics } from '~/hooks/useLearnableMetrics'

interface LearnablePropertiesProps {
	metrics: LearnableMetrics
	updatedAt: string
	insertedAt: string
}

export function LearnableProperties({
	metrics,
	updatedAt,
	insertedAt
}: LearnablePropertiesProps) {
	const {
		isUnreviewed,
		freshnessTierInfo,
		freshnessTierColor,
		stabilityText,
		stabilityTooltipText
	} = metrics

	return (
		<div className='mb-3 flex items-center justify-start gap-2 font-semibold text-sm'>
			{isUnreviewed ? (
				<div className='flex items-center gap-1'>
					<Sparkles className='h-3 w-3' />
					<span>Unreviewed</span>
				</div>
			) : (
				<>
					{/* Bucket status */}
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className={`flex items-center gap-1 ${freshnessTierColor}`}>
								<Brain className='h-3 w-3' />
								<span>{freshnessTierInfo.label}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='bottom'>
							{freshnessTierInfo.tooltip ??
								'Complete a review to see freshness tier'}
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
