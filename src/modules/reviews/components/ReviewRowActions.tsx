import * as stylex from '@stylexjs/stylex'
import { Ellipsis } from 'lucide-react'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import { iconSizes } from '~/styles/tokens.stylex'

const styles = stylex.create({
	// Shown while the row is hovered, keyboard focused, or has its menu open.
	// Always shown on touch, where there is no hover to reveal it. The row's
	// description fade follows the same rules.
	trigger: {
		opacity: {
			default: null,
			'@media (hover: hover)': {
				default: 0,
				[stylex.when.ancestor(':has(:focus-visible)')]: 1,
				[stylex.when.ancestor(':has([data-popup-open])')]: 1,
				[stylex.when.ancestor(':hover')]: 1,
			},
		},
	},
})

type ReviewRowActionsProps = {
	onDelete: () => void
}

/** The menu at the end of a review row. */
export function ReviewRowActions({ onDelete }: ReviewRowActionsProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label='Review actions'
						iconOnly
						shape='round'
						size='micro'
						variant='ghost'
						xstyle={styles.trigger}
					/>
				}
			>
				<Ellipsis aria-hidden='true' size={iconSizes.sm} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
