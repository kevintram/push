import * as stylex from '@stylexjs/stylex'
import type { AppHotkey } from '@tanstack/react-hotkeys'
import { Maximize2, Minimize2, Minus, X } from 'lucide-react'
import type { Ref } from 'react'

import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { ShortcutKeys } from '~/modules/shortcuts/components/ShortcutKeys'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	header: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		justifyContent: 'space-between',
		minInlineSize: 0,
		paddingInlineEnd: spacing.xs,
		paddingInlineStart: spacing.sm,
	},
	title: {
		margin: 0,
		overflow: 'hidden',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontSize: fontSizes.md,
		fontWeight: fontWeights.medium,
		lineHeight: 1.3,
		minInlineSize: 0,
		textAlign: 'start',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	titleButton: {
		padding: 0,
		borderStyle: 'none',
		backgroundColor: colorsSemantic.surfaceTransparent,
		color: 'inherit',
		cursor: 'pointer',
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		// Stretches the click target over the nearest positioned ancestor, so
		// the whole minimized window restores it, not just the title text.
		'::after': {
			inset: 0,
			content: '""',
			position: 'absolute',
		},
	},
	actions: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
		// Lifts the controls above the title's stretched click target.
		position: 'relative',
	},
	// Ghost buttons tint toward black, which disappears on dark surfaces, so
	// the controls tint toward the header's text color instead.
	control: {
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': 'color-mix(in srgb, currentColor 15%, transparent)',
			':active': 'color-mix(in srgb, currentColor 22%, transparent)',
		},
		color: {
			default: 'inherit',
			':hover': 'inherit',
			':active': 'inherit',
		},
	},
})

const TITLE = 'New review'

type ReviewComposerWindowHeaderProps = {
	/** Lets a dialog point `aria-labelledby` at the title. */
	titleId?: string
	isExpanded?: boolean
	onClose: () => void
	onMinimize?: () => void
	/** Shown in the minimize button's tooltip, where a key minimizes too. */
	minimizeHotkey?: AppHotkey
	/** Turns the title into a button, e.g. to restore a minimized window. */
	onTitleClick?: () => void
	titleButtonRef?: Ref<HTMLButtonElement>
	onToggleExpanded?: () => void
}

export function ReviewComposerWindowHeader({
	titleId,
	isExpanded = false,
	onClose,
	onMinimize,
	minimizeHotkey,
	onTitleClick,
	titleButtonRef,
	onToggleExpanded,
}: ReviewComposerWindowHeaderProps) {
	const minimizeButton = onMinimize && (
		<Button
			aria-label='Minimize review composer'
			iconOnly
			onClick={onMinimize}
			shape='round'
			size='small'
			variant='ghost'
			xstyle={styles.control}
		>
			<Minus aria-hidden='true' size={iconSizes.sm} />
		</Button>
	)

	return (
		<header {...stylex.props(styles.header)}>
			{onTitleClick ? (
				<button
					id={titleId}
					ref={titleButtonRef}
					onClick={onTitleClick}
					type='button'
					{...stylex.props(styles.title, styles.titleButton)}
				>
					{TITLE}
				</button>
			) : (
				<h2 id={titleId} {...stylex.props(styles.title)}>
					{TITLE}
				</h2>
			)}
			<div {...stylex.props(styles.actions)}>
				{minimizeButton && minimizeHotkey ? (
					<Tooltip>
						<TooltipTrigger render={minimizeButton} />
						<TooltipContent>
							Minimize
							<ShortcutKeys hotkey={minimizeHotkey} />
						</TooltipContent>
					</Tooltip>
				) : (
					minimizeButton
				)}
				{onToggleExpanded && (
					<Button
						aria-expanded={isExpanded}
						aria-label={
							isExpanded
								? 'Collapse review composer'
								: 'Expand review composer'
						}
						iconOnly
						onClick={onToggleExpanded}
						shape='round'
						size='small'
						variant='ghost'
						xstyle={styles.control}
					>
						{isExpanded ? (
							<Minimize2 aria-hidden='true' size={iconSizes.sm} />
						) : (
							<Maximize2 aria-hidden='true' size={iconSizes.sm} />
						)}
					</Button>
				)}
				<Button
					aria-label='Close review composer'
					iconOnly
					onClick={onClose}
					shape='round'
					size='small'
					variant='ghost'
					xstyle={styles.control}
				>
					<X aria-hidden='true' size={iconSizes.sm} />
				</Button>
			</div>
		</header>
	)
}
