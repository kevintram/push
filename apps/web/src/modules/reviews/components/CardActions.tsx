import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'

import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
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
	/** Styles for the menu trigger, such as revealing it on hover. */
	menuTriggerXstyle?: stylex.StyleXStyles
}

/** A card's toolbar: a link to its page, its status toggles, and its menu. */
export function CardActions({
	card,
	showGoToCard = false,
	menuTriggerXstyle,
}: CardActionsProps) {
	return (
		<div {...stylex.props(styles.container)}>
			{showGoToCard ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label='Go to card'
								iconOnly
								shape='round'
								variant='ghost'
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
								<ArrowUpRight
									aria-hidden='true'
									size={iconSizes.sm}
								/>
							</Button>
						}
					/>
					<TooltipContent>Go to card</TooltipContent>
				</Tooltip>
			) : null}
			<CardStatusToggles card={card} />
			<CardMenu card={card} triggerXstyle={menuTriggerXstyle} />
		</div>
	)
}
