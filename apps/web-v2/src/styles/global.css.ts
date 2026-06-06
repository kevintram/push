import { globalStyle } from '@vanilla-extract/css'
import { vars } from './theme.css'

globalStyle('*', {
	boxSizing: 'border-box'
})

globalStyle('html, body, #root', {
	minHeight: '100%',
	margin: 0
})

globalStyle('body', {
	background: vars.color.background,
	color: vars.color.foreground,
	fontFamily: vars.font.family,
	textRendering: 'optimizeLegibility',
	WebkitFontSmoothing: 'antialiased',
	MozOsxFontSmoothing: 'grayscale'
})

globalStyle('button, input, textarea, select', {
	font: 'inherit'
})
