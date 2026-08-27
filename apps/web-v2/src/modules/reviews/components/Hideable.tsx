import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useCallback, useState } from 'react'

import { Button } from '~/components/ui'
import { radii, spacing } from '~/styles/tokens.stylex'

type HideableProps = {
	children?: ReactNode
	defaultRevealed?: boolean
	onRevealedChange?: (revealed: boolean) => void
	revealed?: boolean
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	container: {
		display: 'grid',
	},
	children: {
		gridColumn: '1',
		gridRow: '1',
	},
	overlay: {
		borderRadius: radii.lg,
		gridColumn: '1',
		gridRow: '1',
		blockSize: 'auto',

		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',

		// negative margin so text doesn't peek behind through rounded corners
		margin: `calc(${spacing.xs} * -1)`,
	},
})

// TODO(4): instead of a panel, what if we just used collapsible?
export function Hideable({
	children,
	defaultRevealed,
	onRevealedChange,
	revealed,
	xstyle,
}: HideableProps) {
	const [uncontrolledRevealed, setUncontrolledRevealed] = useState(
		() => defaultRevealed ?? false,
	)
	const isControlled = revealed !== undefined
	const isRevealed = isControlled ? revealed : uncontrolledRevealed

	const reveal = useCallback(() => {
		if (!isControlled) setUncontrolledRevealed(true)
		onRevealedChange?.(true)
	}, [isControlled, onRevealedChange])

	return (
		<div {...stylex.props(styles.container, xstyle)}>
			<div
				{...stylex.props(styles.children)}
				aria-hidden={isRevealed ? undefined : true}
				inert={isRevealed ? undefined : true}
			>
				{children}
			</div>
			{isRevealed ? null : (
				<Button
					onClick={reveal}
					variant='outline'
					xstyle={styles.overlay}
				>
					Reveal
				</Button>
			)}
		</div>
	)
}
