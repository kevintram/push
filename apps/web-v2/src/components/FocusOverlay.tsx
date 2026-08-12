import * as stylex from '@stylexjs/stylex'

import { Button } from '~/components/ui'
import { colors } from '~/styles/colors.stylex'

const styles = stylex.create({
	container: {
		backgroundColor: colors.bgSurfaceTertiary,

		inset: 0,
		position: 'fixed',
		zIndex: 1000,
	},
	hidden: {
		display: 'none',
	},
})

type FocusOverlayProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function FocusOverlay({ open, onOpenChange }: FocusOverlayProps) {
	return (
		<div
			{...stylex.props(
				styles.container,
				open ? undefined : styles.hidden,
			)}
		>
			HELLO!
			<Button onClick={() => onOpenChange(false)}>Close</Button>
		</div>
	)
}
