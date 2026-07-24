import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { layout } from '~/styles/tokens.stylex'

const styles = stylex.create({
	// Full-width centering track. Centering lives here (via justifyContent)
	// rather than `marginInline: auto` on the column, because the global reset
	// `*:not(dialog) { margin: 0 }` is unlayered and would override StyleX's
	// layered margin rule.
	track: {
		display: 'flex',
		justifyContent: 'center',
		minHeight: '100%',
		width: '100%',
	},
	column: {
		flexShrink: 1,
		maxWidth: layout.contentMaxWidth,
		minWidth: 0,
		width: '100%',
	},
})

type ContentColumnProps = {
	children: ReactNode
	xstyle?: stylex.StyleXStyles
}

export function ContentColumn({ children, xstyle }: ContentColumnProps) {
	return (
		<div {...stylex.props(styles.track)}>
			<div {...stylex.props(styles.column, xstyle)}>{children}</div>
		</div>
	)
}
