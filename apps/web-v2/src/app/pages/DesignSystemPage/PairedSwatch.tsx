import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/tokens.stylex'

/**
 * The specimen sheet's signature element. Every color token is defined as a
 * light/dark pair, so we render both halves at once — a token's identity is the
 * pair, not either mode alone.
 */

const styles = stylex.create({
	track: {
		display: 'flex',
		height: '100%',
		width: '100%',
	},
	half: {
		flexGrow: 1,
		flexShrink: 1,

		flexBasis: 0,
	},
	dark: {
		borderLeftColor: colors.border,
		borderLeftStyle: 'solid',
		borderLeftWidth: '1px',
	},
})

export function PairedSwatch({ light, dark }: { light: string; dark: string }) {
	return (
		<div {...stylex.props(styles.track)}>
			<div
				className={stylex.props(styles.half).className}
				style={{ backgroundColor: light }}
			/>
			<div
				className={stylex.props(styles.half, styles.dark).className}
				style={{ backgroundColor: dark }}
			/>
		</div>
	)
}
