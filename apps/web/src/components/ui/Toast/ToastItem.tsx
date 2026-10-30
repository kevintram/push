import { Toast as ToastPrimitive, type ToastObject } from '@base-ui/react/toast'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import {
	CircleCheck,
	Info,
	LoaderCircle,
	type LucideIcon,
	OctagonX,
	TriangleAlert,
} from 'lucide-react'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import { Button } from '../Button/Button'
import { ToastClose } from './ToastClose'

const spin = stylex.keyframes({
	to: { transform: 'rotate(360deg)' },
})

const styles = stylex.create({
	root: {
		'--toast-gap': spacing.md,
		'--toast-height-current':
			'var(--toast-frontmost-height, var(--toast-height))',
		'--toast-offset-current':
			'calc((var(--toast-offset-y) * -1) + (var(--toast-index) * var(--toast-gap) * -1) + var(--toast-swipe-movement-y))',
		'--toast-peek': spacing.md,
		'--toast-scale': 'calc(max(0, 1 - (var(--toast-index) * 0.1)))',
		'--toast-shrink': 'calc(1 - var(--toast-scale))',

		borderColor: {
			default: colorsSemantic.borderPrimary,
			':focus-visible': colorsSemantic.borderFocus,
		},
		borderRadius: radii.xl,
		borderStyle: 'solid',
		borderWidth: 1,
		backgroundColor: colorsSemantic.surfaceRaised,
		boxShadow: `0 8px 24px ${colorsSemantic.shadowStrong}`,
		color: colorsSemantic.textPrimary,

		insetInlineEnd: 0,
		position: 'absolute',
		bottom: 0,

		// Base UI measures by setting `height: auto` and reading it back. The
		// global `allow-keywords` would animate that read from the stacked height.
		interpolateSize: 'numeric-only',
		height: {
			default: 'var(--toast-height-current)',
			':is([data-expanded])': 'var(--toast-height)',
		},
		width: '100%',

		opacity: {
			default: 1,
			':is([data-limited])': 0,
		},
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: 2,
		outlineStyle: 'solid',
		outlineWidth: 2,
		pointerEvents: 'auto',
		transform: {
			default:
				'translateX(var(--toast-swipe-movement-x)) translateY(calc(var(--toast-swipe-movement-y) - (var(--toast-index) * var(--toast-peek)) - (var(--toast-shrink) * var(--toast-height-current)))) scale(var(--toast-scale))',
			':is([data-ending-style]:not([data-limited]):not([data-swipe-direction]))':
				'translateY(150%)',
			':is([data-ending-style][data-swipe-direction="down"])':
				'translateY(calc(var(--toast-swipe-movement-y) + 150%))',
			':is([data-ending-style][data-swipe-direction="left"])':
				'translateX(calc(var(--toast-swipe-movement-x) - 150%)) translateY(var(--toast-offset-current))',
			':is([data-ending-style][data-swipe-direction="right"])':
				'translateX(calc(var(--toast-swipe-movement-x) + 150%)) translateY(var(--toast-offset-current))',
			':is([data-ending-style][data-swipe-direction="up"])':
				'translateY(calc(var(--toast-swipe-movement-y) - 150%))',
			':is([data-expanded])':
				'translateX(var(--toast-swipe-movement-x)) translateY(var(--toast-offset-current))',
			':is([data-starting-style])': 'translateY(150%)',
		},
		transitionDuration: {
			default: '500ms, 500ms, 150ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'transform, opacity, height',
		transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
		userSelect: 'none',
		willChange: 'transform',

		'::after': {
			content: "''",
			insetInlineStart: 0,
			position: 'absolute',
			height: 'calc(var(--toast-gap) + 1px)',
			top: '100%',
			width: '100%',
		},
	},
	content: {
		padding: spacing.lg,
		gap: spacing.xs,

		overflow: 'hidden',
		alignItems: 'stretch',
		display: 'flex',
		flexDirection: 'column',
		height: '100%',

		opacity: {
			default: 1,
			':is([data-behind])': 0,
			':is([data-expanded])': 1,
		},
		transitionDuration: {
			default: '250ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'opacity',
		transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
	},
	header: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'grid',
		gridTemplateColumns: 'minmax(0, 1fr) auto',
	},
	heading: {
		gap: spacing.md,
		alignItems: 'center',
		display: 'flex',
		minWidth: 0,
	},
	body: {
		gap: spacing.sm,
		display: 'grid',
		justifyItems: 'start',
		minWidth: 0,
	},
	bodyWithIcon: {
		paddingInlineStart: `calc(${iconSizes.sm} + ${spacing.md})`,
	},
	title: {
		margin: 0,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		lineHeight: 1.4,
	},
	description: {
		margin: 0,
		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.sm,
		lineHeight: 1.4,
		overflowWrap: 'anywhere',
	},
	icon: {
		flexShrink: 0,
		height: iconSizes.sm,
		width: iconSizes.sm,
	},
	error: { color: colorsSemantic.textDanger },
	info: { color: colorsSemantic.textToday },
	loading: {
		animationDuration: '1s',
		animationIterationCount: 'infinite',
		animationName: spin,
		animationTimingFunction: 'linear',
		color: colorsSemantic.textSecondary,
	},
	stackOrder: (index: number) => ({ zIndex: 1000 - index }),
	success: { color: colorsSemantic.textSuccess },
	warning: { color: colorsSemantic.textPrimary },
})

const ICONS: Record<string, { Icon: LucideIcon; xstyle: StyleXStyles }> = {
	error: { Icon: OctagonX, xstyle: styles.error },
	info: { Icon: Info, xstyle: styles.info },
	loading: { Icon: LoaderCircle, xstyle: styles.loading },
	success: { Icon: CircleCheck, xstyle: styles.success },
	warning: { Icon: TriangleAlert, xstyle: styles.warning },
}

export function ToastItem({
	index,
	toastItem,
}: {
	index: number
	toastItem: ToastObject<object>
}) {
	const icon = toastItem.type ? ICONS[toastItem.type] : undefined
	const hasTitle = Boolean(toastItem.title)
	// A lone description takes the title's place beside the icon.
	const description = (
		<ToastPrimitive.Description {...stylex.props(styles.description)} />
	)
	const hasBody =
		(hasTitle && Boolean(toastItem.description)) ||
		Boolean(toastItem.actionProps?.children)

	return (
		<ToastPrimitive.Root
			toast={toastItem}
			{...stylex.props(styles.root, styles.stackOrder(index))}
		>
			<ToastPrimitive.Content {...stylex.props(styles.content)}>
				<div {...stylex.props(styles.header)}>
					<div {...stylex.props(styles.heading)}>
						{icon && (
							<icon.Icon
								aria-hidden='true'
								{...stylex.props(styles.icon, icon.xstyle)}
							/>
						)}
						{hasTitle ? (
							<ToastPrimitive.Title
								{...stylex.props(styles.title)}
							/>
						) : (
							description
						)}
					</div>
					<ToastClose />
				</div>
				{hasBody && (
					<div
						{...stylex.props(
							styles.body,
							icon && styles.bodyWithIcon,
						)}
					>
						{hasTitle && description}
						<ToastPrimitive.Action
							render={<Button size='micro' variant='secondary' />}
						/>
					</div>
				)}
			</ToastPrimitive.Content>
		</ToastPrimitive.Root>
	)
}
