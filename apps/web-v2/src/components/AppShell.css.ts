import { style } from '@vanilla-extract/css'

import { vars } from '~/styles/theme.css'

export const shell = style({
	minHeight: '100%',
	background: vars.color.background,
	color: vars.color.foreground,
})
