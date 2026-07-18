import type { ColorTokenName } from './colorSpecimens.types'

export type SolidForegroundSpecimen = {
	fill: ColorTokenName
	foreground: ColorTokenName
	label: string
}

export const solidForegroundSpecimens: ReadonlyArray<SolidForegroundSpecimen> =
	[
		{
			label: 'Brand · rest',
			fill: 'bgFillBrand',
			foreground: 'textBrandOnBgFill',
		},
		{
			label: 'Brand · hover',
			fill: 'bgFillBrandHover',
			foreground: 'textBrandOnBgFillHover',
		},
		{
			label: 'Brand · active',
			fill: 'bgFillBrandActive',
			foreground: 'textBrandOnBgFillActive',
		},
		{
			label: 'Info · rest',
			fill: 'bgFillInfo',
			foreground: 'textInfoOnBgFill',
		},
		{
			label: 'Info · hover',
			fill: 'bgFillInfoHover',
			foreground: 'textInfoOnBgFill',
		},
		{
			label: 'Info · active',
			fill: 'bgFillInfoActive',
			foreground: 'textInfoOnBgFill',
		},
		{
			label: 'Success · rest',
			fill: 'bgFillSuccess',
			foreground: 'textSuccessOnBgFill',
		},
		{
			label: 'Success · hover',
			fill: 'bgFillSuccessHover',
			foreground: 'textSuccessOnBgFill',
		},
		{
			label: 'Success · active',
			fill: 'bgFillSuccessActive',
			foreground: 'textSuccessOnBgFill',
		},
		{
			label: 'Warning · rest',
			fill: 'bgFillWarning',
			foreground: 'textWarningOnBgFill',
		},
		{
			label: 'Warning · hover',
			fill: 'bgFillWarningHover',
			foreground: 'textWarningOnBgFill',
		},
		{
			label: 'Warning · active',
			fill: 'bgFillWarningActive',
			foreground: 'textWarningOnBgFill',
		},
		{
			label: 'Danger · rest',
			fill: 'bgFillDanger',
			foreground: 'textDangerOnBgFill',
		},
		{
			label: 'Danger · hover',
			fill: 'bgFillDangerHover',
			foreground: 'textDangerOnBgFill',
		},
		{
			label: 'Danger · active',
			fill: 'bgFillDangerActive',
			foreground: 'textDangerOnBgFill',
		},
		{
			label: 'Emphasis · rest',
			fill: 'bgFillEmphasis',
			foreground: 'textEmphasisOnBgFill',
		},
		{
			label: 'Emphasis · hover',
			fill: 'bgFillEmphasisHover',
			foreground: 'textEmphasisOnBgFillHover',
		},
		{
			label: 'Emphasis · active',
			fill: 'bgFillEmphasisActive',
			foreground: 'textEmphasisOnBgFillActive',
		},
		{
			label: 'Magic',
			fill: 'bgFillMagic',
			foreground: 'textMagicOnBgFill',
		},
		{ label: 'Inverse', fill: 'bgFillInverse', foreground: 'textInverse' },
	]
