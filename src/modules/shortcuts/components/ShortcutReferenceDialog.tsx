import * as stylex from '@stylexjs/stylex'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useState } from 'react'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui'

import { appHotkeys } from '../appHotkeys'
import { ShortcutReferenceList } from './ShortcutReferenceList'

const styles = stylex.create({
	content: {
		maxInlineSize: '28rem',
	},
})

/** Lists every keyboard shortcut. `Mod+/` opens it from anywhere. */
export function ShortcutReferenceDialog() {
	const [isOpen, setIsOpen] = useState(false)

	useHotkey(appHotkeys.openShortcuts, () => setIsOpen(true))

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent xstyle={styles.content}>
				<DialogHeader>
					<DialogTitle>Keyboard shortcuts</DialogTitle>
				</DialogHeader>
				<ShortcutReferenceList />
			</DialogContent>
		</Dialog>
	)
}
