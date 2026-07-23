import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { useHideMode } from '~/stores/HideMode'
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
	const { hideMode } = useHideMode()
	const [revealed, setRevealed] = useState(hideMode === 'off') // only start off as revealed if hideMode is off
	const intentionallyRevealed = useRef(false)

	useEffect(() => {
		// handle hideMode turning on/off
		if (hideMode === 'off') {
			setRevealed(true) // turn off overlay
		} else if (!intentionallyRevealed.current) {
			// if turn on hideMode and never intentionally revealed
			setRevealed(false) // show overlay
		}
	}, [hideMode])

	const reveal = useCallback(() => {
		setRevealed(true)
		intentionallyRevealed.current = true
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
				<Button onClick={reveal} shape='round'>
					Reveal
				</Button>
			</div>
		</div>
	)
}
