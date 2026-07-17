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

export const gray = stylex.defineVars({
	'50': {
		default: 'oklch(99.11% 0 none)',
		[DARK]: 'oklch(20.02% 0 none)',
	},
	'100': {
		default: 'oklch(97.91% 0 none)',
		[DARK]: 'oklch(22.64% 0 none)',
	},
	'200': {
		default: 'oklch(96.42% 0 none)',
		[DARK]: 'oklch(25.62% 0 none)',
	},
	'300': {
		default: 'oklch(94.61% 0 none)',
		[DARK]: 'oklch(27.68% 0 none)',
	},
	'400': {
		default: 'oklch(93.10% 0 none)',
		[DARK]: 'oklch(30.12% 0 none)',
	},
	'500': {
		default: 'oklch(91.28% 0 none)',
		[DARK]: 'oklch(32.50% 0 none)',
	},
	'600': {
		default: 'oklch(89.14% 0 none)',
		[DARK]: 'oklch(36.39% 0 none)',
	},
	'700': {
		default: 'oklch(82.97% 0 none)',
		[DARK]: 'oklch(43.13% 0 none)',
	},
	'800': {
		default: 'oklch(65.00% 0 none)',
		[DARK]: 'oklch(54.52% 0 none)',
	},
	'900': {
		default: 'oklch(61.67% 0 none)',
		[DARK]: 'oklch(59.31% 0 none)',
	},
	'950': {
		default: 'oklch(20.46% 0 none)',
		[DARK]: 'oklch(94.61% 0 none)',
	},
})

export const red = stylex.defineVars({
	'50': {
		default: 'oklch(98.4% 0.0098 29.02)',
		[DARK]: 'oklch(20.7% 0.0196 29.02)',
	},
	'100': {
		default: 'oklch(95.5% 0.0285 29.02)',
		[DARK]: 'oklch(25.4% 0.0569 29.02)',
	},
	'200': {
		default: 'oklch(92.7% 0.0619 29.02)',
		[DARK]: 'oklch(29.2% 0.0945 29.02)',
	},
	'300': {
		default: 'oklch(89.3% 0.0820 29.02)',
		[DARK]: 'oklch(33.2% 0.1049 29.02)',
	},
	'400': {
		default: 'oklch(85.4% 0.1003 29.02)',
		[DARK]: 'oklch(38.2% 0.1080 29.02)',
	},
	'500': {
		default: 'oklch(80.4% 0.1221 29.02)',
		[DARK]: 'oklch(45.0% 0.1171 29.02)',
	},
	'600': {
		default: 'oklch(71.7% 0.1888 29.02)',
		[DARK]: 'oklch(53.9% 0.1438 29.02)',
	},
	'700': {
		default: 'oklch(63.0% 0.2555 29.02)',
		[DARK]: 'oklch(63.0% 0.2555 29.02)',
	},
	'800': {
		default: 'oklch(58.9% 0.2577 29.02)',
		[DARK]: 'oklch(68.0% 0.2350 29.02)',
	},
	'900': {
		default: 'oklch(56.4% 0.2555 29.02)',
		[DARK]: 'oklch(79.0% 0.1892 29.02)',
	},
	'950': {
		default: 'oklch(24.6% 0.0591 29.02)',
		[DARK]: 'oklch(90.9% 0.0545 29.02)',
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
	xl: '10px',
	full: '9999px',
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
