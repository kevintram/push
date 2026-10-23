import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useCallback, useState } from 'react'

import { Button } from '~/components/ui'
import { neutral } from '~/styles/colors/colorsPrimitive.stylex'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { radii } from '~/styles/tokens.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

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
	childrenHidden: {
		visibility: 'hidden',
	},
	// A filled surface, unlike a plain outline button, so the hidden content
	// reads as covered.
	overlay: {
		borderColor: colorsSemantic.borderSubtle,
		borderRadius: radii['3xl'],
		gridColumn: '1',
		gridRow: '1',
		blockSize: 'auto',

		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',

		backgroundColor: {
			[DARK]: {
				default: neutral.s900,
				':hover': neutral.s800,
				':active': neutral.s700,
			},
			default: neutral.s100,
			':hover': neutral.s200,
			':active': neutral.s300,
		},
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
				{...stylex.props(
					styles.children,
					isRevealed ? undefined : styles.childrenHidden,
				)}
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
