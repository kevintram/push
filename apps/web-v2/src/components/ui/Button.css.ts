import { type RecipeVariants, recipe } from '@vanilla-extract/recipes'
import { vars } from '~/styles/theme.css'

export const button = recipe({
	base: {
		height: 36,
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: vars.space[2],
		border: '1px solid transparent',
		borderRadius: vars.radius.md,
		fontFamily: vars.font.family,
		fontWeight: vars.fontWeight.medium,
		letterSpacing: 0,
		lineHeight: 1,
		whiteSpace: 'nowrap',
		cursor: 'pointer',
		transition:
			'background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
		selectors: {
			'&:focus-visible': {
				outline: `2px solid ${vars.color.focusRing}`,
				outlineOffset: 2
			},
			'&:disabled': {
				cursor: 'not-allowed',
				opacity: 0.55
			}
		}
	},
	variants: {
		variant: {
			primary: {
				background: vars.color.foreground,
				color: vars.color.background,
				selectors: {
					'&:hover:not(:disabled)': {
						background: vars.color.primaryHover
					}
				}
			},
			secondary: {
				background: vars.color.surface,
				borderColor: vars.color.border,
				color: vars.color.foreground,
				selectors: {
					'&:hover:not(:disabled)': {
						background: vars.color.surfaceHover
					}
				}
			}
		},
		size: {
			sm: {
				height: 32,
				paddingInline: vars.space[3],
				fontSize: vars.fontSize.sm
			},
			md: {
				height: 36,
				paddingInline: vars.space[4],
				fontSize: vars.fontSize.sm
			}
		}
	},
	defaultVariants: {
		size: 'md',
		variant: 'primary'
	}
})

export type ButtonVariants = RecipeVariants<typeof button>
