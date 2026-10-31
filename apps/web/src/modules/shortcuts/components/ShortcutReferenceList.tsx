import * as stylex from '@stylexjs/stylex'
import { useAppHotkeyList } from '@tanstack/react-hotkeys'
import { useId } from 'react'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

import { groupShortcuts } from '../groupShortcuts'
import { ShortcutKeys } from './ShortcutKeys'

const styles = stylex.create({
	list: {
		gap: spacing.xl,
		display: 'flex',
		flexDirection: 'column',
	},
	heading: {
		margin: 0,
		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		marginBlockEnd: spacing.xs,
	},
	shortcuts: {
		margin: 0,
	},
	row: {
		gap: spacing.md,
		paddingBlock: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'space-between',
	},
	name: {
		fontSize: fontSizes.sm,
		minInlineSize: 0,
	},
	keys: {
		margin: 0,
		flexShrink: 0,
	},
})

/**
 * Every shortcut, grouped, with the groups that work on the current page
 * first. Mounted only while the reference is open, since it rerenders as
 * shortcuts register and unregister.
 */
export function ShortcutReferenceList() {
	const groups = groupShortcuts(useAppHotkeyList())
	const idPrefix = useId()

	return (
		<div {...stylex.props(styles.list)}>
			{groups.map(({ group, items }) => {
				const headingId = `${idPrefix}-${group}`
				return (
					<section key={group} aria-labelledby={headingId}>
						<h3 id={headingId} {...stylex.props(styles.heading)}>
							{group}
						</h3>
						<dl {...stylex.props(styles.shortcuts)}>
							{items.map(({ appHotkey }) => (
								<div
									key={appHotkey.id}
									{...stylex.props(styles.row)}
								>
									<dt {...stylex.props(styles.name)}>
										{appHotkey.meta?.name}
									</dt>
									<dd {...stylex.props(styles.keys)}>
										<ShortcutKeys hotkey={appHotkey} />
									</dd>
								</div>
							))}
						</dl>
					</section>
				)
			})}
		</div>
	)
}
