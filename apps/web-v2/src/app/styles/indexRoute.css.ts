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
	color: vars.color.mutedForeground,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	letterSpacing: 0,
	textTransform: 'uppercase'
})

export const copy = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[3]
})

export const heading = style({
	margin: 0,
	maxWidth: 660,
	color: vars.color.foreground,
	fontSize: 'clamp(2.5rem, 8vw, 5rem)',
	fontWeight: vars.fontWeight.bold,
	letterSpacing: 0,
	lineHeight: 0.95
})

export const description = style({
	margin: 0,
	maxWidth: 560,
	color: vars.color.mutedForeground,
	fontSize: vars.fontSize.lg,
	lineHeight: 1.55
})
