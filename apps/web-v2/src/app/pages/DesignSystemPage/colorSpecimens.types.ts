import type { colors } from '~/styles/colors.stylex'

export type ColorTokenName = keyof (typeof colors)['__tokens']
export type EffectTokenName = keyof (typeof colors)['__tokens']

export type PaintKind =
	| 'background'
	| 'backgroundImage'
	| 'border'
	| 'icon'
	| 'text'

export type ColorTokenSpecimen = {
	name: ColorTokenName
	description: string
	lightMapping: string
	darkMapping: string
	paint: PaintKind
}

export type EffectTokenSpecimen = {
	name: EffectTokenName
	description: string
	lightMapping: string
	darkMapping: string
	paint: 'inset' | 'shadow'
}

export type ColorTokenCategory = {
	id: string
	title: string
	description: string
	tokens: ReadonlyArray<ColorTokenSpecimen>
}

const humanize = (name: string) =>
	name
		.replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replaceAll('Bg', 'background')
		.toLowerCase()

export const colorToken = (
	name: ColorTokenName,
	lightMapping: string,
	darkMapping: string,
	paint: PaintKind,
	description = humanize(name),
): ColorTokenSpecimen => ({
	name,
	description,
	lightMapping,
	darkMapping,
	paint,
})

export const effectToken = (
	name: EffectTokenName,
	lightMapping: string,
	darkMapping: string,
	paint: EffectTokenSpecimen['paint'],
	description = humanize(name),
): EffectTokenSpecimen => ({
	name,
	description,
	lightMapping,
	darkMapping,
	paint,
})
