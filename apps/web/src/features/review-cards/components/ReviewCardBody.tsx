import { Anvil, Baby, Brain, Sparkles } from 'lucide-react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

import { RevealPanel } from '~/components/RevealPanel'
import { Button } from '~/components/ui/button'
import { CardContent, CardFooter } from '~/components/ui/card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'
import { getRatingIcon } from '~/utils/getRatingIcon'
import type { Rating } from '~/features/reviews/types/review.types'

export function ReviewCardBody({
	canUseGuessPanel,
	guessSecondaryText,
	handleCopyGuessText,
	handleCopyRevealText,
	handleRevealPrimary,
	handleRevealSecondary,
	highlightedPrimary,
	highlightedSecondary,
	hidePrimary,
	hideSecondary,
	isLargeCard,
	isRevealPanelCopied,
	revealPanelTab,
	reviewCardAnswer,
	setGuessSecondaryText,
	setRevealPanelTab,
	typeBadgeLabel
}: {
	canUseGuessPanel: boolean
	guessSecondaryText: string
	handleCopyGuessText: () => void
	handleCopyRevealText: () => void
	handleRevealPrimary: (event: React.MouseEvent) => void
	handleRevealSecondary: (event: React.MouseEvent) => void
	highlightedPrimary: ReactNode
	highlightedSecondary: ReactNode
	hidePrimary: boolean
	hideSecondary: boolean
	isLargeCard: boolean
	isRevealPanelCopied: boolean
	revealPanelTab: 'guess' | 'reveal' | null
	reviewCardAnswer: string
	setGuessSecondaryText: Dispatch<SetStateAction<string>>
	setRevealPanelTab: Dispatch<SetStateAction<'guess' | 'reveal' | null>>
	typeBadgeLabel: string
}) {
	let primaryContent: ReactNode
	if (hidePrimary) {
		primaryContent = (
			<div className='relative'>
				<div
					aria-hidden={true}
					className='break-word invisible line-clamp-5 whitespace-pre-wrap font-semibold leading-tight [overflow-wrap:anywhere]'
				>
					{highlightedPrimary}
				</div>
				<div className='absolute inset-0'>
					<Button
						className='h-full w-full justify-center rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 px-2.5 py-2 text-muted-foreground text-sm hover:bg-muted/70'
						onClick={handleRevealPrimary}
						onKeyDown={event => event.stopPropagation()}
						size='default'
						variant='outline'
					>
						Reveal
					</Button>
				</div>
			</div>
		)
	} else if (highlightedPrimary) {
		primaryContent = (
			<h3 className='break-word line-clamp-5 whitespace-pre-wrap font-semibold leading-tight [overflow-wrap:anywhere]'>
				{highlightedPrimary}
			</h3>
		)
	} else {
		primaryContent = null
	}

	let secondaryContent: ReactNode
	if (hideSecondary) {
		if (canUseGuessPanel) {
			secondaryContent = (
				<RevealPanel
					autoFocusGuess={true}
					guessValue={guessSecondaryText}
					isCopied={isRevealPanelCopied}
					onGuessCopy={handleCopyGuessText}
					onGuessValueChange={setGuessSecondaryText}
					onRevealCopy={handleCopyRevealText}
					onValueChange={setRevealPanelTab}
					revealValue={reviewCardAnswer}
					stopPropagation={true}
					value={revealPanelTab}
					variant='card'
				/>
			)
		} else {
			secondaryContent = (
				<div className='relative'>
					<p
						aria-hidden={true}
						className='break-word invisible line-clamp-[8] whitespace-pre-wrap text-sm [overflow-wrap:anywhere]'
					>
						{highlightedSecondary}
					</p>
					<div className='absolute inset-0'>
						<Button
							className='h-full w-full justify-center rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 px-2.5 py-2 text-muted-foreground text-sm hover:bg-muted/70'
							onClick={handleRevealSecondary}
							onKeyDown={event => event.stopPropagation()}
							size='default'
							variant='outline'
						>
							Reveal
						</Button>
					</div>
				</div>
			)
		}
	} else if (highlightedSecondary) {
		secondaryContent = (
			<p
				className={cn(
					'break-word whitespace-pre-wrap text-sm [overflow-wrap:anywhere]',
					isLargeCard ? 'min-h-0 flex-1 overflow-y-auto' : 'line-clamp-[8]'
				)}
			>
				{highlightedSecondary}
			</p>
		)
	} else {
		secondaryContent = null
	}

	return (
		<CardContent className='flex min-h-0 flex-1 flex-col gap-3 p-0'>
			<div className='flex min-h-0 flex-1 flex-col gap-1'>
				<div className='flex flex-wrap items-center gap-1 text-muted-foreground text-xs'>
					<span>{typeBadgeLabel}</span>
				</div>

				<div className='flex min-h-0 flex-1 flex-col gap-2'>
					{primaryContent}
					{secondaryContent}
				</div>
			</div>
		</CardContent>
	)
}

export function ReviewCardFooterMeta({
	freshnessTierColor,
	freshnessTierInfo,
	isUnreviewed,
	lastReviewedDate,
	lastReviewedText,
	lastReviewRating,
	relationsCount,
	showRatingMeta,
	showReviewedMeta,
	showStabilityMeta,
	stabilityText
}: {
	freshnessTierColor: string
	freshnessTierInfo: { label: string; tooltip?: string | null }
	isUnreviewed: boolean
	lastReviewedDate: string
	lastReviewedText: string
	lastReviewRating: Rating | null
	relationsCount: number
	showRatingMeta: boolean
	showReviewedMeta: boolean
	showStabilityMeta: boolean
	stabilityText: string
}) {
	return (
		<CardFooter className='gap-1 px-0 pt-2 text-muted-foreground text-xs'>
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
							<TooltipContent>{freshnessTierInfo.tooltip}</TooltipContent>
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
								<TooltipContent>{lastReviewedDate}</TooltipContent>
							</Tooltip>
						</>
					) : null}
					{showRatingMeta ? (
						<span className='flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground text-muted-foreground'>
							{lastReviewRating ? getRatingIcon(lastReviewRating) : null}
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
			<div className='flex-1' />
			<Tooltip>
				<TooltipTrigger
					render={
						<div className='flex items-center gap-1'>
							<Baby className='h-3 w-3' />
							<span>{relationsCount}</span>
						</div>
					}
				/>
				<TooltipContent>
					{relationsCount === 1
						? '1 related card'
						: `${relationsCount} related cards`}
				</TooltipContent>
			</Tooltip>
		</CardFooter>
	)
}
