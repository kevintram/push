import { style } from '@vanilla-extract/css'
import { vars } from '~/styles/theme.css'

export const page = style({
	minHeight: '100%',
	padding: vars.space[5],
	display: 'grid',
	alignItems: 'center'
})

export const hero = style({
	width: 'min(100%, 760px)',
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[6]
})

export const eyebrow = style({
	margin: 0,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
	letterSpacing: 0
})
