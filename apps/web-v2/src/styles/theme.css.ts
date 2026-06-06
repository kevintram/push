import { createGlobalTheme } from '@vanilla-extract/css'

export const vars = createGlobalTheme(':root', {
	color: {
		background: '#f7f5ef',
		foreground: '#171717',
		surface: '#ffffff',
		surfaceHover: '#f0eee8',
		mutedForeground: '#66645d',
		border: '#ded9cd',
		focusRing: '#26735b',
		primaryHover: '#2a2a2a'
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
