import * as stylex from '@stylexjs/stylex'
import { type AppHotkey, formatForDisplay } from '@tanstack/react-hotkeys'
import { Fragment } from 'react'

import { Kbd, KbdGroup } from '~/components/ui'
import { fontSizes, fontWeights } from '~/styles/tokens.stylex'

type ShortcutKeysProps = {
	hotkey: AppHotkey
	/**
	 * Hides the keys from assistive technology, for a control that already
	 * announces them through `aria-keyshortcuts`.
	 */
	'aria-hidden'?: boolean
}

const styles = stylex.create({
	// Tinted from the surrounding text color, like `Kbd`, so it sits a step
	// quieter than the keys on any surface.
	then: {
		color: 'color-mix(in srgb, currentColor 60%, transparent)',
		fontFamily: 'inherit',
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.regular,
		userSelect: 'none',
	},
})

/**
 * An app hotkey's keys as a `Kbd` badge, or one badge per step of a sequence
 * joined by "then". Renders nothing while the hotkey is unbound.
 */
export function ShortcutKeys({
	hotkey: appHotkey,
	'aria-hidden': ariaHidden,
}: ShortcutKeysProps) {
	const { hotkey } = appHotkey
	if (hotkey === null) return null
	if (typeof hotkey === 'string')
		return <Kbd aria-hidden={ariaHidden}>{formatForDisplay(hotkey)}</Kbd>

	return (
		<KbdGroup aria-hidden={ariaHidden}>
			{hotkey.map((step, index) => (
				// A sequence can repeat a step, so a step's place is its identity.
				<Fragment key={index}>
					{index > 0 && (
						<span {...stylex.props(styles.then)}>then</span>
					)}
					<Kbd>{formatForDisplay(step)}</Kbd>
				</Fragment>
			))}
		</KbdGroup>
	)
}
