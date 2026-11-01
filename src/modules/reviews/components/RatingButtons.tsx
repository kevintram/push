import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import * as stylex from '@stylexjs/stylex'
import { formatForDisplay, useHotkeys } from '@tanstack/react-hotkeys'
import { ChevronDown } from 'lucide-react'
import { useImperativeHandle, useRef } from 'react'

import { Kbd } from '~/components/ui'
import { ariaKeyShortcuts } from '~/modules/shortcuts/ariaKeyShortcuts'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import type { Rating } from '../types/review.types'
import { RatingMenu } from './RatingMenu'
import {
	getRating,
	ratingChoices,
	ratingFromChoice,
	TODO_VALUE,
	todoRating,
} from './reviewRatings'

// The tray's height (a 32px segment plus 4px padding on each side), so the
// badge's well and the collapsed pill match it.
const TRAY_BLOCK_SIZE = '40px'
// A status dot rather than a glyph beside text, so it sits outside the
// iconSizes scale.
const BADGE_SIZE = '18px'
const BADGE_ICON_SIZE = '0.75rem' // 12px

// Measured on the whole control, the well included, so the dock, the
// composer, and the dialog share them. As it narrows, the keys go first, then
// the icons, then the tray collapses into a menu. The keys still pick at every
// width. Local strings, not shared constants: StyleX can leave an imported
// at-rule key unresolved in dev, emitting invalid CSS.
const noKeys = '@container (width < 560px)'
const noIcons = '@container (width < 440px)'
const collapsed = '@container (width < 340px)'

const styles = stylex.create({
	root: {
		containerType: 'inline-size',
		flexShrink: 0,
	},
	expanded: {
		gap: '6px',
		alignItems: 'center',
		display: {
			[collapsed]: 'none',
			default: 'flex',
		},
	},
	disabled: {
		opacity: 0.5,
	},
	well: {
		borderRadius: radii.full,
		alignItems: 'center',
		backgroundColor: colorsSemantic.surfaceTertiary,
		blockSize: TRAY_BLOCK_SIZE,
		color: colorsSemantic.textInteractive,
		display: 'flex',
		flexShrink: 0,
		inlineSize: TRAY_BLOCK_SIZE,
		justifyContent: 'center',
	},
	badge: {
		borderRadius: radii.full,
		alignItems: 'center',
		backgroundColor: colorsSemantic.surfaceInteractiveInverse,
		blockSize: BADGE_SIZE,
		color: colorsSemantic.textOnInverse,
		display: 'flex',
		inlineSize: BADGE_SIZE,
		justifyContent: 'center',
	},
	// The collapsed tray: the current rating, opening a menu of every choice.
	pill: {
		borderRadius: radii.full,
		borderStyle: 'none',
		paddingBlock: 0,
		paddingInlineEnd: '12px',
		paddingInlineStart: '11px',

		gap: spacing.sm,
		alignItems: 'center',
		blockSize: TRAY_BLOCK_SIZE,
		display: {
			[collapsed]: 'inline-flex',
			default: 'none',
		},

		backgroundColor: colorsSemantic.surfaceTertiary,
		color: {
			default: colorsSemantic.textInteractive,
			':hover': colorsSemantic.textInteractiveHover,
		},
		cursor: {
			default: 'pointer',
			':disabled': 'not-allowed',
		},
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		transitionDuration: {
			default: '125ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'color',
		userSelect: 'none',
	},
	pillLabel: {
		color: colorsSemantic.textPrimary,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		lineHeight: 1,
		whiteSpace: 'nowrap',
	},
	tray: {
		padding: spacing.xs,

		borderRadius: radii.full,
		alignItems: 'center',
		backgroundColor: colorsSemantic.surfaceTertiary,
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		minInlineSize: 0,
	},
	// Between every pair of segments, like tabs. It hides beside the checked
	// segment but keeps its space, so the segments never shift.
	separator: {
		marginInline: '2px',
		backgroundColor: colorsSemantic.borderPrimary,
		blockSize: '20px',
		flexShrink: 0,
		inlineSize: '1px',
		transitionDuration: {
			default: '125ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'opacity',
	},
	separatorHidden: {
		opacity: 0,
	},
	segment: {
		borderRadius: radii.full,
		paddingBlock: 0,
		paddingInlineEnd: {
			default: '6px',
			[noKeys]: '10px',
		},
		paddingInlineStart: '10px',

		alignItems: 'center',
		blockSize: '32px',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		justifyContent: {
			default: 'space-between',
			[noKeys]: 'center',
		},
		minInlineSize: 0,

		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparentHover,
		},
		color: {
			default: colorsSemantic.textInteractive,
			':hover': colorsSemantic.textInteractiveHover,
		},
		cursor: {
			default: 'pointer',
			':is([data-disabled])': 'not-allowed',
		},
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.regular,
		lineHeight: 1,
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		transitionDuration: {
			default: '125ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'background-color, box-shadow, color',
		transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
		userSelect: 'none',
		whiteSpace: 'nowrap',
	},
	// A raised chip, so the badge stays the only dark mark.
	checked: {
		backgroundColor: {
			default: colorsSemantic.surfacePrimary,
			':hover': colorsSemantic.surfacePrimary,
		},
		boxShadow: `0 1px 3px ${colorsSemantic.shadowStrong}`,
		color: {
			default: colorsSemantic.textPrimary,
			':hover': colorsSemantic.textPrimary,
		},
		fontWeight: fontWeights.medium,
	},
	label: {
		gap: '6px',
		alignItems: 'center',
		display: 'inline-flex',
	},
	icon: {
		display: {
			default: null,
			[noIcons]: 'none',
		},
	},
	// Replaces the key's own `display` whole, so it restates `Kbd`'s value.
	key: {
		display: {
			default: 'inline-flex',
			[noKeys]: 'none',
		},
	},
})

type RatingButtonsProps = {
	disabled?: boolean
	/**
	 * Where the rating keys listen, such as the whole modal around the tray.
	 * Typing in a text field inside it never picks a rating.
	 */
	hotkeyTarget: HTMLElement | React.RefObject<HTMLElement | null> | null
	onSetRating: (rating: Rating | null) => void
	rating: Rating | undefined
	/**
	 * Focuses the selected option, the group's tab stop, or the menu's trigger
	 * while the tray is collapsed.
	 */
	ref?: React.Ref<Pick<HTMLElement, 'focus'>>
	xstyle?: stylex.StyleXStyles
}

/**
 * The current rating as a badge in its own well, then every choice as a
 * segment of one tray, divided like tabs, with Todo last. Narrow, the
 * segments drop their keys, then their icons, and below that the whole tray
 * collapses into a menu. While focus is in `hotkeyTarget`, each choice's key
 * picks it.
 */
export function RatingButtons({
	disabled = false,
	hotkeyTarget,
	onSetRating,
	rating,
	ref,
	xstyle,
}: RatingButtonsProps) {
	const value = rating ?? TODO_VALUE
	const current = getRating(rating)

	const pick = (next: string) => {
		if (next !== value) onSetRating(ratingFromChoice(next))
	}

	const checkedRef = useRef<HTMLElement>(null)
	const pillRef = useRef<HTMLButtonElement>(null)
	// Only one of the two shows. A hidden element refuses focus, so the pill
	// takes it whenever the checked segment can't.
	useImperativeHandle(ref, () => ({
		focus: options => {
			checkedRef.current?.focus(options)
			if (document.activeElement !== checkedRef.current)
				pillRef.current?.focus(options)
		},
	}))

	// Shown both in the well and in the collapsed pill.
	const badge = current ? (
		<span aria-hidden='true' {...stylex.props(styles.badge)}>
			<current.Icon size={BADGE_ICON_SIZE} strokeWidth={2.5} />
		</span>
	) : (
		<todoRating.Icon aria-hidden='true' size={iconSizes.sm} />
	)

	useHotkeys(
		ratingChoices.map(choice => ({
			hotkey: choice.hotkey,
			callback: () => pick(choice.value),
		})),
		{ enabled: !disabled, target: hotkeyTarget },
	)

	return (
		<div
			{...stylex.props(styles.root, disabled && styles.disabled, xstyle)}
		>
			<div {...stylex.props(styles.expanded)}>
				{/* Repeats the checked segment at a glance; the group announces it. */}
				<div aria-hidden='true' {...stylex.props(styles.well)}>
					{badge}
				</div>
				<RadioGroup
					aria-label='Rating'
					disabled={disabled}
					onValueChange={next => pick(next as string)}
					value={value}
					{...stylex.props(styles.tray)}
				>
					{ratingChoices.map(
						(
							{ value: optionValue, label, Icon, hotkey },
							index,
						) => {
							const checked = optionValue === value
							const previousChecked =
								ratingChoices[index - 1]?.value === value
							return [
								index > 0 && (
									<span
										aria-hidden='true'
										key={`separator-${optionValue}`}
										{...stylex.props(
											styles.separator,
											(checked || previousChecked) &&
												styles.separatorHidden,
										)}
									/>
								),
								<Radio.Root
									aria-keyshortcuts={ariaKeyShortcuts(hotkey)}
									key={optionValue}
									ref={checked ? checkedRef : undefined}
									value={optionValue}
									{...stylex.props(
										styles.segment,
										checked && styles.checked,
									)}
								>
									<span {...stylex.props(styles.label)}>
										<Icon
											aria-hidden='true'
											size={iconSizes.sm}
											{...stylex.props(styles.icon)}
										/>
										{label}
									</span>
									<Kbd aria-hidden='true' xstyle={styles.key}>
										{hotkey.hotkey &&
											formatForDisplay(hotkey.hotkey)}
									</Kbd>
								</Radio.Root>,
							]
						},
					)}
				</RadioGroup>
			</div>
			<RatingMenu
				disabled={disabled}
				onSetRating={onSetRating}
				rating={rating}
				trigger={
					<button
						ref={pillRef}
						type='button'
						{...stylex.props(styles.pill)}
					/>
				}
			>
				{badge}
				<span {...stylex.props(styles.pillLabel)}>
					{(current ?? todoRating).label}
				</span>
				<ChevronDown aria-hidden='true' size={iconSizes.sm} />
			</RatingMenu>
		</div>
	)
}
