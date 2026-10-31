import * as stylex from '@stylexjs/stylex'

export const a11y = stylex.create({
	/** Hide content visually while keeping it available to screen readers. */
	visuallyHidden: {
		blockSize: '1px',
		clip: 'rect(0 0 0 0)',
		clipPath: 'inset(50%)',
		inlineSize: '1px',
		position: 'absolute',
		whiteSpace: 'nowrap',
		overflowX: 'hidden',
		overflowY: 'hidden',
	},
})
