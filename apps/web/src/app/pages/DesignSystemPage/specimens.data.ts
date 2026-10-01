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
	{ name: 'xs', value: '6px' },
	{ name: 'sm', value: '8px' },
	{ name: 'md', value: '10px' },
	{ name: 'lg', value: '12px' },
	{ name: 'xl', value: '16px' },
	{ name: 'full', value: '9999px' },
]

/** A branded line used to set type specimens, in place of a generic pangram. */
export const TYPE_SPECIMEN_LINE = 'A little every day is how memory sticks.'
