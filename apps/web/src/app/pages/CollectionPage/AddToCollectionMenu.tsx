import * as stylex from '@stylexjs/stylex'
import { ChevronDown, Plus } from 'lucide-react'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	// Pulled into the gutter by its padding and border, plus the plus glyph's
	// inset (5 of its 24 viewBox units), so the glyph lines up with the card
	// titles. Secondary until hovered, so it doesn't compete with them.
	trigger: {
		marginInlineStart: `calc((${spacing.sm} + 1px + ${iconSizes.sm} * 5 / 24) * -1)`,

		color: {
			default: colorsSemantic.textSecondary,
			':hover': colorsSemantic.textPrimary,
		},
	},
	// Inline rather than flex items, so `middle` centers them on the label's
	// x-height, like the sidebar's chevrons. Margins stand in for the button's
	// gap, which only spaces flex items.
	icon: {
		display: 'inline',
		verticalAlign: 'middle',
	},
	leadingIcon: {
		marginInlineEnd: spacing.xs,
	},
	trailingIcon: {
		marginInlineStart: spacing.xs,
	},
})

type AddToCollectionMenuProps = {
	/** Names what the new card joins, for assistive technology. */
	label: string
	disabled?: boolean
	onAddCard: () => void
	onAddSection: () => void
}

/** The "Add" menu under each group of cards on the collection page. */
export function AddToCollectionMenu({
	label,
	disabled = false,
	onAddCard,
	onAddSection,
}: AddToCollectionMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				disabled={disabled}
				render={
					<Button
						aria-label={label}
						shape='round'
						variant='ghost'
						size='tiny'
						xstyle={styles.trigger}
					/>
				}
			>
				<span>
					<Plus
						aria-hidden='true'
						size={iconSizes.sm}
						{...stylex.props(styles.icon, styles.leadingIcon)}
					/>
					Add
					<ChevronDown
						aria-hidden='true'
						size={iconSizes.sm}
						{...stylex.props(styles.icon, styles.trailingIcon)}
					/>
				</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start'>
				<DropdownMenuItem onClick={onAddCard}>Card</DropdownMenuItem>
				<DropdownMenuItem onClick={onAddSection}>
					Section
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
