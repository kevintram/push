import * as stylex from '@stylexjs/stylex'

const DARK = '@media (prefers-color-scheme: dark)'

export const colors = stylex.defineVars({
	background: {
		default: 'oklch(97.00% 0.0082 91.48)',
		[DARK]: 'oklch(18.20% 0.0060 91.48)',
	},
	foreground: {
		default: 'oklch(20.46% 0 none)',
		[DARK]: 'oklch(94.80% 0.0060 91.48)',
	},
	primary: {
		default: 'oklch(20.46% 0 none)',
		[DARK]: 'oklch(92.00% 0.0060 91.48)',
	},
	primaryForeground: {
		default: 'oklch(97.00% 0.0082 91.48)',
		[DARK]: 'oklch(18.20% 0.0060 91.48)',
	},
	primaryHover: {
		default: 'oklch(28.50% 0 none)',
		[DARK]: 'oklch(84.00% 0.0075 91.48)',
	},

	secondary: {
		default: 'oklch(92.81% 0.0153 90.24)',
		[DARK]: 'oklch(25.50% 0.0100 91.48)',
	},
	secondaryForeground: {
		default: 'oklch(20.46% 0 none)',
		[DARK]: 'oklch(92.00% 0.0060 91.48)',
	},
	secondaryHover: {
		default: 'oklch(90.40% 0.0183 89.37)',
		[DARK]: 'oklch(30.50% 0.0120 91.48)',
	},

	muted: {
		default: 'oklch(94.90% 0.0083 91.48)',
		[DARK]: 'oklch(23.00% 0.0075 91.48)',
	},
	mutedForeground: {
		default: 'oklch(50.28% 0.0112 93.69)',
		[DARK]: 'oklch(72.00% 0.0100 93.69)',
	},

	destructive: {
		default: 'oklch(50.03% 0.1821 29.51)',
		[DARK]: 'oklch(65.00% 0.1650 29.51)',
	},
	destructiveForeground: {
		default: 'oklch(98.18% 0.0090 34.30)',
		[DARK]: 'oklch(18.20% 0.0060 34.30)',
	},
	destructiveMuted: {
		default: 'oklch(92.05% 0.0297 30.64)',
		[DARK]: 'oklch(29.00% 0.0500 30.64)',
	},

	surface: {
		default: 'oklch(100.00% 0 none)',
		[DARK]: 'oklch(21.50% 0.0070 91.48)',
	},
	surfaceActive: {
		default: 'oklch(94.90% 0.0083 91.48)',
		[DARK]: 'oklch(27.00% 0.0090 91.48)',
	},

	border: {
		default: 'oklch(88.59% 0.0171 88.01)',
		[DARK]: 'oklch(33.00% 0.0120 88.01)',
	},
	input: {
		default: 'oklch(92.81% 0.0153 90.24)',
		[DARK]: 'oklch(27.00% 0.0100 90.24)',
	},
	focusRing: {
		default: 'oklch(50.15% 0.0845 168.71)',
		[DARK]: 'oklch(73.00% 0.0950 168.71)',
	},
})

export const fonts = stylex.defineVars({
	sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
})

export const fontSizes = stylex.defineVars({
	xs: '0.75rem',
	sm: '0.875rem',
	md: '1rem',
	lg: '1.125rem',
	xl: '1.25rem',
})

export const fontWeights = stylex.defineVars({
	regular: '400',
	medium: '500',
	semibold: '600',
	bold: '750',
})

export const radii = stylex.defineVars({
	sm: '4px',
	md: '6px',
	lg: '8px',
})

export const spacing = stylex.defineVars({
	none: '0',
	xs: '4px',
	sm: '8px',
	md: '12px',
	lg: '16px',
	xl: '24px',
	'2xl': '32px',
	'3xl': '48px',
	'4xl': '64px',
	'5xl': '96px',
})

export const iconSizes = stylex.defineVars({
	xs: '12px',
	sm: '16px',
	md: '24px',
	lg: '32px',
	xl: '48px',
})
