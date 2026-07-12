/**
 * Static token data for the design-system specimen sheet.
 *
 * Color values mirror `src/styles/tokens.stylex.ts`: `light` is the `default`
 * branch, `dark` is the `@media (prefers-color-scheme: dark)` branch. They are
 * duplicated here on purpose so each specimen can display *both* modes at once,
 * independent of the viewer's current theme.
 */

export interface ColorSpecimen {
	name: string
	role: string
	light: string
	dark: string
}

export const colorSpecimens: Array<ColorSpecimen> = [
	{
		name: 'background',
		role: 'App canvas',
		light: 'oklch(97.00% 0.0082 91.48)',
		dark: 'oklch(18.20% 0.0060 91.48)',
	},
	{
		name: 'foreground',
		role: 'Body text',
		light: 'oklch(20.46% 0 none)',
		dark: 'oklch(94.80% 0.0060 91.48)',
	},
	{
		name: 'primary',
		role: 'Solid actions',
		light: 'oklch(20.46% 0 none)',
		dark: 'oklch(92.00% 0.0060 91.48)',
	},
	{
		name: 'primaryForeground',
		role: 'Text on primary',
		light: 'oklch(97.00% 0.0082 91.48)',
		dark: 'oklch(18.20% 0.0060 91.48)',
	},
	{
		name: 'primaryHover',
		role: 'Primary, hovered',
		light: 'oklch(28.50% 0 none)',
		dark: 'oklch(84.00% 0.0075 91.48)',
	},
	{
		name: 'secondary',
		role: 'Quiet fills',
		light: 'oklch(92.81% 0.0153 90.24)',
		dark: 'oklch(25.50% 0.0100 91.48)',
	},
	{
		name: 'secondaryForeground',
		role: 'Text on secondary',
		light: 'oklch(20.46% 0 none)',
		dark: 'oklch(92.00% 0.0060 91.48)',
	},
	{
		name: 'secondaryHover',
		role: 'Secondary, hovered',
		light: 'oklch(90.40% 0.0183 89.37)',
		dark: 'oklch(30.50% 0.0120 91.48)',
	},
	{
		name: 'muted',
		role: 'Subtle panels',
		light: 'oklch(94.90% 0.0083 91.48)',
		dark: 'oklch(23.00% 0.0075 91.48)',
	},
	{
		name: 'mutedForeground',
		role: 'Captions & hints',
		light: 'oklch(50.28% 0.0112 93.69)',
		dark: 'oklch(72.00% 0.0100 93.69)',
	},
	{
		name: 'destructive',
		role: 'Danger',
		light: 'oklch(50.03% 0.1821 29.51)',
		dark: 'oklch(65.00% 0.1650 29.51)',
	},
	{
		name: 'destructiveForeground',
		role: 'Text on danger',
		light: 'oklch(98.18% 0.0090 34.30)',
		dark: 'oklch(18.20% 0.0060 34.30)',
	},
	{
		name: 'destructiveMuted',
		role: 'Danger, tinted',
		light: 'oklch(92.05% 0.0297 30.64)',
		dark: 'oklch(29.00% 0.0500 30.64)',
	},
	{
		name: 'surface',
		role: 'Cards & sheets',
		light: 'oklch(100.00% 0 none)',
		dark: 'oklch(21.50% 0.0070 91.48)',
	},
	{
		name: 'surfaceActive',
		role: 'Surface, pressed',
		light: 'oklch(94.90% 0.0083 91.48)',
		dark: 'oklch(27.00% 0.0090 91.48)',
	},
	{
		name: 'border',
		role: 'Hairlines',
		light: 'oklch(88.59% 0.0171 88.01)',
		dark: 'oklch(33.00% 0.0120 88.01)',
	},
	{
		name: 'input',
		role: 'Field fills',
		light: 'oklch(92.81% 0.0153 90.24)',
		dark: 'oklch(27.00% 0.0100 90.24)',
	},
	{
		name: 'focusRing',
		role: 'Focus & signal',
		light: 'oklch(50.15% 0.0845 168.71)',
		dark: 'oklch(73.00% 0.0950 168.71)',
	},
]

export interface ScaleSpecimen {
	name: string
	value: string
}

export const fontSizeSpecimens: Array<ScaleSpecimen> = [
	{ name: 'xs', value: '0.75rem' },
	{ name: 'sm', value: '0.875rem' },
	{ name: 'md', value: '1rem' },
	{ name: 'lg', value: '1.125rem' },
	{ name: 'xl', value: '1.25rem' },
]

export const fontWeightSpecimens: Array<ScaleSpecimen> = [
	{ name: 'regular', value: '400' },
	{ name: 'medium', value: '500' },
	{ name: 'semibold', value: '600' },
	{ name: 'bold', value: '750' },
]

export const spacingSpecimens: Array<ScaleSpecimen> = [
	{ name: 'xs', value: '4px' },
	{ name: 'sm', value: '8px' },
	{ name: 'md', value: '12px' },
	{ name: 'lg', value: '16px' },
	{ name: 'xl', value: '24px' },
	{ name: '2xl', value: '32px' },
	{ name: '3xl', value: '48px' },
	{ name: '4xl', value: '64px' },
	{ name: '5xl', value: '96px' },
]

export const radiiSpecimens: Array<ScaleSpecimen> = [
	{ name: 'sm', value: '4px' },
	{ name: 'md', value: '6px' },
	{ name: 'lg', value: '8px' },
]

/** A branded line used to set type specimens, in place of a generic pangram. */
export const TYPE_SPECIMEN_LINE = 'A little every day is how memory sticks.'
