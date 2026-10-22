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
	'2xl': '1.5rem',
	'3xl': '2rem',
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

// UI glyphs, paired by name with fontSizes: use the icon that shares the
// text's name. Each is 2px larger than its text because lucide glyphs leave
// padding inside their box. Comments give px at the default 16px root size.
export const iconSizes = stylex.defineVars({
	xs: '0.875rem', // 14px, beside xs (12px) text
	sm: '1rem', // 16px, beside sm (14px) text
	md: '1.125rem', // 18px, beside md (16px) text
})

// Standalone graphics such as avatars, spinners, and illustrations.
export const graphicSizes = stylex.defineVars({
	sm: '1.5rem', // 24px
	md: '2rem', // 32px
})

export const buttonSizes = stylex.defineConsts({
	// In rem so buttons grow with the text and icons inside them. Comments give
	// px at the default 16px root size.
	// Hitbox around the sm glyph: 5px inset per side.
	micro: '1.625rem', // 26px
	tiny: '1.75rem', // 28px
	small: '2rem', // 32px
	medium: '2.25rem', // 36px
	large: '2.5rem', // 40px
})

// Sidebar rows are as tall as the small icon buttons that share them.
const sidebarRowHeight = buttonSizes.small
const sidebarIconSize = iconSizes.sm

export const appSidebar = stylex.defineConsts({
	iconSize: sidebarIconSize,
	rowHeight: sidebarRowHeight,
	// Lands a row's leading icon where a row-height icon button centers its
	// glyph.
	rowInset: `calc((${sidebarRowHeight} - ${sidebarIconSize}) / 2)`,
	// The expanded sidebar, and the collections popover beside the collapsed rail.
	width: '240px',
})

export const breakpoints = stylex.defineConsts({
	tablet: '@media (min-width: 768px)',
	desktop: '@media (min-width: 1024px)',
})

export const layout = stylex.defineConsts({
	// Shared by the shell, sidebars, and page toolbars to keep top controls aligned.
	appShellInset: '6px',
	// Space above the top bar controls inside the page card and the sidebars,
	// so the sidebar header centers on the same line as page breadcrumbs.
	topBarInset: spacing.sm,
	contentColumnMaxWidth: '768px',
	rowBleed: '8px',
})
