import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'

import { Button } from '~/components/ui'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import type { Card } from '../types/review.types'
import { CardMenu } from './CardMenu'
import { CardStatusToggles } from './CardStatusToggles'

const styles = stylex.create({
	container: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
	},
})

type CardActionsProps = {
	card: Card
	showGoToCard?: boolean
	/**
	 * Also binds keys while the menu is closed, for the open card's page.
	 * List rows bind keys only inside their open menu.
	 */
	hasHotkeys?: boolean
}

/** A card's toolbar: a link to its page, its status toggles, and its menu. */
export function CardActions({
	card,
	showGoToCard = false,
	hasHotkeys = false,
}: CardActionsProps) {
	return (
		<div {...stylex.props(styles.container)}>
			{showGoToCard ? (
				<Button
					shape='round'
					variant='secondary'
					size='small'
					nativeButton={false}
					render={
						<Link
							to='/cards/$cardId'
							params={{ cardId: card._id }}
							// Base UI marks non-native buttons as `button`.
							role='link'
						/>
					}
				>
					Go to card
					<ArrowUpRight aria-hidden='true' size={iconSizes.sm} />
				</Button>
			) : null}
			<CardStatusToggles card={card} />
			<CardMenu card={card} hasHotkeys={hasHotkeys} />
		</div>
	)
}
