import { createGlobalTheme } from '@vanilla-extract/css'

export const vars = createGlobalTheme(':root', {
	color: {
		background: 'oklch(97.00% 0.0082 91.48)',
		foreground: 'oklch(20.46% 0 none)',
		primary: 'oklch(20.46% 0 none)',
		primaryForeground: 'oklch(97.00% 0.0082 91.48)',
		primaryHover: 'oklch(28.50% 0 none)',
		secondary: 'oklch(92.81% 0.0153 90.24)',
		secondaryForeground: 'oklch(20.46% 0 none)',
		secondaryHover: 'oklch(90.40% 0.0183 89.37)',
		muted: 'oklch(94.90% 0.0083 91.48)',
		mutedForeground: 'oklch(50.28% 0.0112 93.69)',
		destructive: 'oklch(50.03% 0.1821 29.51)',
		destructiveForeground: 'oklch(98.18% 0.0090 34.30)',
		destructiveMuted: 'oklch(92.05% 0.0297 30.64)',
		surface: 'oklch(100.00% 0 none)',
		surfaceHover: 'oklch(94.90% 0.0083 91.48)',
		border: 'oklch(88.59% 0.0171 88.01)',
		input: 'oklch(92.81% 0.0153 90.24)',
		focusRing: 'oklch(50.15% 0.0845 168.71)'
	},
	font: {
		family:
			'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
	},
	fontSize: {
		sm: '0.875rem',
		md: '1rem',
		lg: '1.125rem'
	},
	fontWeight: {
		regular: '400',
		medium: '500',
		bold: '750'
	},
	radius: {
		sm: '4px',
		md: '6px',
		lg: '8px'
	},
	space: {
		1: '0.25rem',
		2: '0.5rem',
		3: '0.75rem',
		4: '1rem',
		5: '1.5rem',
		6: '2rem'
	}
})
