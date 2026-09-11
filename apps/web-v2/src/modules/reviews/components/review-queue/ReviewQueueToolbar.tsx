import * as stylex from '@stylexjs/stylex'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { ChevronDown, ChevronUp } from 'lucide-react'

import {
	Button,
	Kbd,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import type { Card } from '~/modules/reviews/types/review.types'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import {
	REVIEW_QUEUE_NEXT_HOTKEY,
	REVIEW_QUEUE_PREVIOUS_HOTKEY,
} from './reviewQueueKeybindings'

type ReviewQueueToolbarProps = {
	currentCard: Card | null
	index: number
	cardCount: number
	onPrevious: () => void
	onNext: () => void
}

const styles = stylex.create({
	header: {
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'flex-end',
		paddingBlockEnd: spacing.md,
	},
	headerButtonCluster: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
	},
})

export function ReviewQueueToolbar({
	currentCard,
	index,
	cardCount,
	onPrevious,
	onNext,
}: ReviewQueueToolbarProps) {
	return (
		<header {...stylex.props(styles.header)}>
			<div {...stylex.props(styles.headerButtonCluster)}>
				{currentCard === null ? null : (
					<>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button.Icon
										aria-label='Previous card'
										shape='round'
										variant='secondary'
										size='small'
										disabled={index === 0}
										onClick={onPrevious}
									>
										<ChevronUp size={iconSizes.md} />
									</Button.Icon>
								}
							/>
							<TooltipContent>
								Previous
								<Kbd>
									{formatForDisplay(
										REVIEW_QUEUE_PREVIOUS_HOTKEY,
									)}
								</Kbd>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button.Icon
										aria-label='Next card'
										shape='round'
										variant='secondary'
										size='small'
										disabled={index === cardCount - 1}
										onClick={onNext}
									>
										<ChevronDown size={iconSizes.md} />
									</Button.Icon>
								}
							/>
							<TooltipContent>
								Next
								<Kbd>
									{formatForDisplay(REVIEW_QUEUE_NEXT_HOTKEY)}
								</Kbd>
							</TooltipContent>
						</Tooltip>
					</>
				)}
			</div>
		</header>
	)
}
