import * as stylex from '@stylexjs/stylex'

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

export const iconWeights = stylex.defineVars({
	regular: '2',
	medium: '2.5',
})

export const radii = stylex.defineVars({
	xs: '6px',
	sm: '8px',
	md: '10px',
	lg: '12px',
	xl: '16px',
	'2xl': '20px',
	'3xl': '24px',
	full: '9999px',
})

export const spacing = stylex.defineVars({
	none: '0',
	'2xs': '2px',
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
	xs: '0.75rem',
	sm: '0.85rem',
	md: '1rem',
	lg: '1.5rem',
	xl: '2rem',
	'2xl': '3rem',
})

export const buttonSizes = stylex.defineConsts({
	// In rem so buttons grow with the text and icons inside them. Comments give
	// px at the default 16px root size.
	// Hitbox around the md glyph: 5px inset per side.
	micro: '1.625rem', // 26px
	tiny: '1.75rem', // 28px
	small: '2rem', // 32px
	medium: '2.25rem', // 36px
	large: '2.5rem', // 40px
})

export const appSidebar = stylex.defineConsts({
	// Sidebar rows are as tall as a small button. This lands a row's leading
	// icon where a small icon button centers its glyph.
	rowInset: `calc((${buttonSizes.small} - ${iconSizes.md}) / 2)`,
})

export const breakpoints = stylex.defineConsts({
	tablet: '@media (min-width: 768px)',
	desktop: '@media (min-width: 1024px)',
})

export const layout = stylex.defineConsts({
	// Shared by the shell, sidebars, and page toolbars to keep top controls aligned.
	appShellInset: '6px',
	contentColumnMaxWidth: '768px',
	rowBleed: '8px',
})
