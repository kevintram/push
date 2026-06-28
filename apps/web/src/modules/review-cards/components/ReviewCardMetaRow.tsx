import { Anvil, Brain, Sparkles } from 'lucide-react'

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { type Rating } from '~/modules/reviews/types/review.types'
import { getRatingIcon } from '~/utils/getRatingIcon'

export function ReviewCardMetaRow({
	freshnessTierColor,
	freshnessTierInfo,
	isUnreviewed,
	lastReviewedDate,
	lastReviewedText,
	lastReviewRating,
	showRatingMeta,
	showReviewedMeta,
	showStabilityMeta,
	stabilityText,
}: {
	freshnessTierColor: string
	freshnessTierInfo: { label: string; tooltip?: string | null }
	isUnreviewed: boolean
	lastReviewedDate: string
	lastReviewedText: string
	lastReviewRating: Rating | null
	showRatingMeta: boolean
	showReviewedMeta: boolean
	showStabilityMeta: boolean
	stabilityText: string
}) {
	return (
		<div className='flex items-center gap-1 pt-2 text-muted-foreground text-xs'>
			{isUnreviewed ? (
				<div className='flex items-center gap-1'>
					<Sparkles className='h-3 w-3' />
					<span>Unreviewed</span>
				</div>
			) : (
				<>
					{freshnessTierInfo.tooltip ? (
						<Tooltip>
							<TooltipTrigger
								render={
									<div
										className={`flex items-center gap-1 font-semibold ${freshnessTierColor}`}
									>
										<Brain className='h-3 w-3' />
										<span>{freshnessTierInfo.label}</span>
									</div>
								}
							/>
							<TooltipContent>
								{freshnessTierInfo.tooltip}
							</TooltipContent>
						</Tooltip>
					) : (
						<span className={`font-semibold ${freshnessTierColor}`}>
							{freshnessTierInfo.label}
						</span>
					)}
					{showReviewedMeta ? (
						<>
							<span className='font-bold'>·</span>
							<Tooltip>
								<TooltipTrigger
									render={
										<span className='flex items-center gap-1 font-semibold'>{`Reviewed ${lastReviewedText}`}</span>
									}
								/>
								<TooltipContent>
									{lastReviewedDate}
								</TooltipContent>
							</Tooltip>
						</>
					) : null}
					{showRatingMeta ? (
						<span className='flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground text-muted-foreground'>
							{lastReviewRating
								? getRatingIcon(lastReviewRating)
								: null}
						</span>
					) : null}
					{showStabilityMeta ? (
						<>
							<span className='font-bold'>·</span>
							<Tooltip>
								<TooltipTrigger
									render={
										<div className='flex items-center gap-1 font-semibold text-muted-foreground'>
											<Anvil className='h-3 w-3' />
											<span>{stabilityText}</span>
										</div>
									}
								/>
								<TooltipContent>
									Lasts {stabilityText} before getting hazy
								</TooltipContent>
							</Tooltip>
						</>
					) : null}
				</>
			)}
		</div>
	)
}
