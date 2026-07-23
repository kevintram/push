import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useCallback, useState } from 'react'

import { colors } from '~/styles/colors.stylex'
import { radii } from '~/styles/tokens.stylex'

import { Button } from './ui'

type HideableProps = {
	children?: ReactNode
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
		borderRadius: radii.xl,
		gridColumn: '1',
		gridRow: '1',

		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',

		backgroundColor: colors.bgFillSecondary,
	},
	overlayHidden: {
		display: 'none',
	},
})

export function Hideable({ children, xstyle }: HideableProps) {
	const [revealed, setRevealed] = useState(false)

	const reveal = useCallback(() => {
		setRevealed(true)
	}, [])

	return (
		<div {...stylex.props(styles.container, xstyle)}>
			<div {...stylex.props(styles.children)}>{children}</div>
			<div
				{...stylex.props(
					styles.overlay,
					revealed ? styles.overlayHidden : null,
				)}
			>
				<Button onClick={reveal} variant='outline' shape='round'>
					Reveal
				</Button>
			</div>
		</div>
	)
}
