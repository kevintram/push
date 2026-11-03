import { Copy } from 'lucide-react'

import { toast } from '~/components/ui/Toast'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { ariaKeyShortcuts } from '~/modules/shortcuts/ariaKeyShortcuts'
import { ShortcutKeys } from '~/modules/shortcuts/components/ShortcutKeys'

/**
 * Explains that hide mode turned on by itself, with a button that turns it
 * back off like the hotkey. Returns the toast's id so the caller can close it.
 */
export function toastHideModeOn(toggleHideMode: () => void) {
	return toast.add({
		actionProps: {
			'aria-keyshortcuts': ariaKeyShortcuts(appHotkeys.toggleHideMode),
			children: (
				<>
					Turn off
					<ShortcutKeys
						hotkey={appHotkeys.toggleHideMode}
						aria-hidden
					/>
				</>
			),
			onClick: toggleHideMode,
		},
		data: { icon: Copy },
		description: 'Answers stay hidden until you reveal them',
		title: 'Hide mode on',
		type: 'info',
	})
}
