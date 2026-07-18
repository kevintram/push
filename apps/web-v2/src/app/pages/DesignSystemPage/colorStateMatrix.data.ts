import type { ColorTokenName, EffectTokenName } from './colorSpecimens.types'

export const colorStates = [
	'rest',
	'hover',
	'active',
	'selected',
	'focus',
	'disabled',
	'invalid',
	'open',
] as const

type StatePaint = {
	background?: ColorTokenName
	border?: ColorTokenName
	effect?: EffectTokenName
	foreground?: ColorTokenName
	outline?: ColorTokenName
}

type StateRow = {
	label: string
	states: Record<(typeof colorStates)[number], StatePaint>
}

export const colorStateRows: ReadonlyArray<StateRow> = [
	{
		label: 'Filled control',
		states: {
			rest: {
				background: 'bgFillSecondary',
				foreground: 'text',
				border: 'borderTertiary',
			},
			hover: {
				background: 'bgFillSecondaryHover',
				foreground: 'text',
				border: 'borderHover',
			},
			active: {
				background: 'bgFillSecondaryActive',
				foreground: 'text',
				border: 'borderHover',
			},
			selected: {
				background: 'bgFillSelected',
				foreground: 'text',
				border: 'borderBrand',
			},
			focus: {
				background: 'bgFillSecondary',
				foreground: 'text',
				border: 'borderTertiary',
				outline: 'borderFocus',
			},
			disabled: {
				background: 'bgFillDisabled',
				foreground: 'textDisabled',
				border: 'borderDisabled',
			},
			invalid: {
				background: 'bgFillDangerSecondary',
				foreground: 'textDanger',
				border: 'borderDanger',
			},
			open: {
				background: 'bgFillSecondaryActive',
				foreground: 'text',
				border: 'borderHover',
			},
		},
	},
	{
		label: 'Surface item',
		states: {
			rest: { background: 'bgSurface', foreground: 'text' },
			hover: { background: 'bgSurfaceHover', foreground: 'text' },
			active: { background: 'bgSurfaceActive', foreground: 'text' },
			selected: {
				background: 'bgSurfaceBrandSelected',
				foreground: 'textBrand',
				border: 'borderBrand',
			},
			focus: {
				background: 'bgSurface',
				foreground: 'text',
				outline: 'borderFocus',
			},
			disabled: {
				background: 'bgSurfaceDisabled',
				foreground: 'textDisabled',
			},
			invalid: {
				background: 'bgSurfaceDanger',
				foreground: 'textDanger',
				border: 'borderDanger',
			},
			open: {
				background: 'bgSurfaceActive',
				foreground: 'text',
				border: 'borderHover',
			},
		},
	},
	{
		label: 'Field',
		states: {
			rest: {
				background: 'inputBgSurface',
				foreground: 'text',
				border: 'inputBorder',
			},
			hover: {
				background: 'inputBgSurfaceHover',
				foreground: 'text',
				border: 'inputBorderHover',
			},
			active: {
				background: 'inputBgSurfaceActive',
				foreground: 'text',
				border: 'inputBorderActive',
			},
			selected: {
				background: 'inputBgSurface',
				foreground: 'text',
				border: 'borderBrand',
			},
			focus: {
				background: 'inputBgSurface',
				foreground: 'text',
				border: 'inputBorder',
				outline: 'borderFocus',
			},
			disabled: {
				background: 'bgSurfaceDisabled',
				foreground: 'textDisabled',
				border: 'borderDisabled',
			},
			invalid: {
				background: 'inputBgSurface',
				foreground: 'textDanger',
				border: 'borderDangerSecondary',
			},
			open: {
				background: 'inputBgSurfaceActive',
				foreground: 'text',
				border: 'inputBorderActive',
			},
		},
	},
	{
		label: 'Navigation',
		states: {
			rest: {
				background: 'bgSurfaceTransparent',
				foreground: 'textSecondary',
			},
			hover: {
				background: 'bgSurfaceSecondaryHover',
				foreground: 'text',
			},
			active: {
				background: 'bgSurfaceSecondaryActive',
				foreground: 'text',
			},
			selected: {
				background: 'bgSurfaceBrandSelected',
				foreground: 'textBrand',
				border: 'borderBrand',
			},
			focus: {
				background: 'bgSurfaceTransparent',
				foreground: 'text',
				outline: 'borderFocus',
			},
			disabled: {
				background: 'bgSurfaceDisabled',
				foreground: 'textDisabled',
			},
			invalid: {
				background: 'bgSurfaceDanger',
				foreground: 'textDanger',
			},
			open: {
				background: 'bgSurfaceSecondaryActive',
				foreground: 'text',
				border: 'borderHover',
			},
		},
	},
	{
		label: 'Floating surface',
		states: {
			rest: {
				background: 'bgSurface',
				foreground: 'text',
				border: 'border',
				effect: 'shadowSubtle',
			},
			hover: {
				background: 'bgSurfaceHover',
				foreground: 'text',
				border: 'borderHover',
				effect: 'shadowSubtle',
			},
			active: {
				background: 'bgSurfaceActive',
				foreground: 'text',
				border: 'borderHover',
				effect: 'shadowSubtle',
			},
			selected: {
				background: 'bgSurfaceSelected',
				foreground: 'text',
				border: 'borderBrand',
				effect: 'shadowSubtle',
			},
			focus: {
				background: 'bgSurface',
				foreground: 'text',
				border: 'border',
				outline: 'borderFocus',
				effect: 'shadowSubtle',
			},
			disabled: {
				background: 'bgSurfaceDisabled',
				foreground: 'textDisabled',
				border: 'borderDisabled',
			},
			invalid: {
				background: 'bgSurfaceDanger',
				foreground: 'textDanger',
				border: 'borderDanger',
				effect: 'shadowSubtle',
			},
			open: {
				background: 'bgSurface',
				foreground: 'text',
				border: 'border',
				effect: 'shadowStrong',
			},
		},
	},
]
