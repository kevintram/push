import { createVar, globalStyle } from '@vanilla-extract/css'
import { type RecipeVariants, recipe } from '@vanilla-extract/recipes'
import { vars } from '~/styles/theme.css'

const focusRing = `0 0 0 3px color-mix(in oklch, ${vars.color.focusRing} 50%, transparent)`
const destructiveRing = `0 0 0 3px color-mix(in oklch, ${vars.color.destructive} 20%, transparent)`

// Per-size icon dimension; the cascade picks the right value per variant.
const iconSize = createVar()

const buttonVariantRecipe = recipe({
	base: {
		vars: { [iconSize]: '16px' },
		display: 'inline-flex',
		flexShrink: 0,
		alignItems: 'center',
		justifyContent: 'center',
		border: '1px solid transparent',
		borderRadius: vars.radius.lg,
		backgroundClip: 'padding-box',
		fontFamily: vars.font.family,
		fontSize: vars.fontSize.sm,
		fontWeight: vars.fontWeight.medium,
		letterSpacing: 0,
		lineHeight: 1,
		whiteSpace: 'nowrap',
		outline: 'none',
		userSelect: 'none',
		transition: 'all 150ms ease',
		selectors: {
			'&:focus-visible': {
				borderColor: vars.color.focusRing,
				boxShadow: focusRing
			},
			'&:active:not([aria-haspopup])': {
				translate: '0 1px'
			},
			'&:disabled': {
				pointerEvents: 'none',
				opacity: 0.5
			},
			'&[aria-invalid="true"]': {
				borderColor: vars.color.destructive,
				boxShadow: destructiveRing
			}
		}
	},
	variants: {
		variant: {
			default: {
				background: vars.color.primary,
				color: vars.color.primaryForeground,
				selectors: {
					'&:hover:not(:disabled)': {
						background: vars.color.primaryHover
					}
				}
			},
			outline: {
				borderColor: vars.color.border,
				background: vars.color.background,
				color: vars.color.foreground,
				selectors: {
					'&:hover:not(:disabled)': {
						background: vars.color.muted,
						color: vars.color.foreground
					},
					'&[aria-expanded="true"]': {
						background: vars.color.muted,
						color: vars.color.foreground
					}
				}
			},
			secondary: {
				background: vars.color.secondary,
				color: vars.color.secondaryForeground,
				selectors: {
					'&:hover:not(:disabled)': {
						background: vars.color.secondaryHover
					},
					'&[aria-expanded="true"]': {
						background: vars.color.secondary,
						color: vars.color.secondaryForeground
					}
				}
			},
			ghost: {
				color: vars.color.foreground,
				selectors: {
					'&:hover:not(:disabled)': {
						background: vars.color.muted,
						color: vars.color.foreground
					},
					'&[aria-expanded="true"]': {
						background: vars.color.muted,
						color: vars.color.foreground
					}
				}
			},
			destructive: {
				background: vars.color.destructiveMuted,
				color: vars.color.destructive,
				selectors: {
					'&:hover:not(:disabled)': {
						background: `color-mix(in oklch, ${vars.color.destructiveMuted}, ${vars.color.destructive} 8%)`
					},
					'&:focus-visible': {
						borderColor: `color-mix(in oklch, ${vars.color.destructive}, transparent 60%)`,
						boxShadow: destructiveRing
					}
				}
			},
			link: {
				color: vars.color.primary,
				textUnderlineOffset: 4,
				selectors: {
					'&:hover:not(:disabled)': {
						textDecoration: 'underline'
					}
				}
			}
		},
		size: {
			default: {
				height: 32,
				gap: vars.space[2],
				paddingInline: '0.625rem',
				selectors: {
					'&:has([data-icon="inline-end"])': {
						paddingRight: vars.space[2]
					},
					'&:has([data-icon="inline-start"])': {
						paddingLeft: vars.space[2]
					}
				}
			},
			xs: {
				vars: { [iconSize]: '12px' },
				height: 24,
				gap: vars.space[1],
				borderRadius: `min(${vars.radius.md}, 10px)`,
				paddingInline: vars.space[2],
				fontSize: '0.75rem',
				selectors: {
					'&:has([data-icon="inline-end"])': {
						paddingRight: '0.375rem'
					},
					'&:has([data-icon="inline-start"])': {
						paddingLeft: '0.375rem'
					}
				}
			},
			sm: {
				vars: { [iconSize]: '14px' },
				height: 28,
				gap: vars.space[1],
				borderRadius: `min(${vars.radius.md}, 12px)`,
				paddingInline: '0.625rem',
				fontSize: '0.8rem',
				selectors: {
					'&:has([data-icon="inline-end"])': {
						paddingRight: '0.375rem'
					},
					'&:has([data-icon="inline-start"])': {
						paddingLeft: '0.375rem'
					}
				}
			},
			lg: {
				height: 36,
				gap: vars.space[2],
				paddingInline: '0.625rem',
				selectors: {
					'&:has([data-icon="inline-end"])': {
						paddingRight: vars.space[2]
					},
					'&:has([data-icon="inline-start"])': {
						paddingLeft: vars.space[2]
					}
				}
			},
			icon: {
				width: 32,
				height: 32
			},
			'icon-xs': {
				vars: { [iconSize]: '12px' },
				width: 24,
				height: 24,
				borderRadius: `min(${vars.radius.md}, 10px)`
			},
			'icon-sm': {
				width: 28,
				height: 28,
				borderRadius: `min(${vars.radius.md}, 12px)`
			},
			'icon-lg': {
				width: 36,
				height: 36
			}
		}
	},
	defaultVariants: {
		size: 'default',
		variant: 'default'
	}
})

// vanilla-extract recipe selectors cannot target descendants, so SVG defaults
// live in globalStyle. Size flows through the iconSize custom property, which
// each size variant overrides via the cascade.
globalStyle(`${buttonVariantRecipe.classNames.base} svg`, {
	pointerEvents: 'none',
	flexShrink: 0,
	width: iconSize,
	height: iconSize
})

export const buttonVariants = buttonVariantRecipe
export type ButtonVariants = RecipeVariants<typeof buttonVariantRecipe>
