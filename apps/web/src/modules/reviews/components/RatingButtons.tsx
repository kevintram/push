import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import * as stylex from '@stylexjs/stylex'
import { formatForDisplay, useHotkeys } from '@tanstack/react-hotkeys'

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
import {
	getRating,
	ratingChoices,
	ratingFromChoice,
	TODO_VALUE,
	todoRating,
} from './reviewRatings'

// The tray's height (a 32px segment plus 4px padding on each side), so the
// badge's well matches it.
const TRAY_BLOCK_SIZE = '40px'
// A status dot rather than a glyph beside text, so it sits outside the
// iconSizes scale.
const BADGE_SIZE = '18px'
const BADGE_ICON_SIZE = '0.75rem' // 12px

const styles = stylex.create({
	root: {
		gap: '6px',
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
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
		paddingInlineEnd: '6px',
		paddingInlineStart: '10px',

		alignItems: 'center',
		blockSize: '32px',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		justifyContent: 'space-between',
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
	/** Attached to the selected option, the group's tab stop. */
	ref?: React.Ref<HTMLElement>
	xstyle?: stylex.StyleXStyles
}

/**
 * The current rating as a badge in its own well, then every choice as a
 * segment of one tray, divided like tabs, with Todo last. While focus is in
 * `hotkeyTarget`, each choice's key picks it.
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
			{/* Repeats the checked segment at a glance; the group announces it. */}
			<div aria-hidden='true' {...stylex.props(styles.well)}>
				{current ? (
					<span {...stylex.props(styles.badge)}>
						<current.Icon
							size={BADGE_ICON_SIZE}
							strokeWidth={2.5}
						/>
					</span>
				) : (
					<todoRating.Icon size={iconSizes.sm} />
				)}
			</div>
			<RadioGroup
				aria-label='Rating'
				disabled={disabled}
				onValueChange={next => pick(next as string)}
				value={value}
				{...stylex.props(styles.tray)}
			>
				{ratingChoices.map(
					({ value: optionValue, label, Icon, hotkey }, index) => {
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
								ref={checked ? ref : undefined}
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
									/>
									{label}
								</span>
								<Kbd aria-hidden='true'>
									{hotkey.hotkey &&
										formatForDisplay(hotkey.hotkey)}
								</Kbd>
							</Radio.Root>,
						]
					},
				)}
			</RadioGroup>
		</div>
	)
}
