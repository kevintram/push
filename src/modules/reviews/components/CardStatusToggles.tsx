import * as stylex from '@stylexjs/stylex'
import { Archive, Flag } from 'lucide-react'

import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import { useCardActions } from '../hooks/useCardActions'
import type { Card } from '../types/review.types'
import { cardStatusStyles } from './cardStatusStyles'

const styles = stylex.create({
	container: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
	},
})

type CardStatusTogglesProps = {
	card: Card
	xstyle?: stylex.StyleXStyles
}

/** A button for each of a card's active statuses, which turns it off. */
export function CardStatusToggles({ card, xstyle }: CardStatusTogglesProps) {
	const { toggleFlag, toggleRetire } = useCardActions()

	const isFlagged = card.flaggedAt !== undefined
	const isRetired = card.retiredAt !== undefined
	if (!isFlagged && !isRetired) return null

	return (
		<div {...stylex.props(styles.container, xstyle)}>
			{isFlagged ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label='Unflag'
								iconOnly
								shape='round'
								variant='ghost'
								size='small'
								onClick={() => toggleFlag([card])}
							>
								<Flag
									aria-hidden='true'
									size={iconSizes.sm}
									{...stylex.props(cardStatusStyles.flagOn)}
								/>
							</Button>
						}
					/>
					<TooltipContent>Unflag</TooltipContent>
				</Tooltip>
			) : null}
			{isRetired ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label='Unretire'
								iconOnly
								shape='round'
								variant='ghost'
								size='small'
								onClick={() => toggleRetire([card])}
							>
								<Archive
									aria-hidden='true'
									size={iconSizes.sm}
									{...stylex.props(
										cardStatusStyles.retiredOn,
									)}
								/>
							</Button>
						}
					/>
					<TooltipContent>Unretire</TooltipContent>
				</Tooltip>
			) : null}
		</div>
	)
}
