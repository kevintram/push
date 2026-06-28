import { keyframes, style } from '@vanilla-extract/css'

import { vars } from '~/styles/theme.css'

const spin = keyframes({
	to: {
		transform: 'rotate(360deg)',
	},
})

export const root = style({
	minHeight: '100%',
	display: 'grid',
	placeItems: 'center',
	gap: vars.space[3],
	color: vars.color.mutedForeground,
})

export const spinner = style({
	width: 20,
	height: 20,
	borderRadius: '50%',
	border: `2px solid ${vars.color.border}`,
	borderTopColor: vars.color.foreground,
	animation: `${spin} 750ms linear infinite`,
})
