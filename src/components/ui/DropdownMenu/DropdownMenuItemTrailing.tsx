import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	// Pushed to the row's end, so every row's trailing content shares one
	// column, at least a gap's width past the longest label.
	column: {
		display: 'inline-flex',
		flexShrink: 0,
		marginInlineStart: 'auto',
		paddingInlineStart: spacing.lg,
	},
})

type DropdownMenuItemTrailingProps = {
	children: React.ReactNode
}

/** A menu item's trailing column. */
export function DropdownMenuItemTrailing({
	children,
}: DropdownMenuItemTrailingProps) {
	return <span {...stylex.props(styles.column)}>{children}</span>
}
