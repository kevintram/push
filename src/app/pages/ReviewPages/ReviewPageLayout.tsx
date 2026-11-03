import * as stylex from '@stylexjs/stylex'
import { Outlet, useLayoutEffect } from '@tanstack/react-router'
import { Copy } from 'lucide-react'
import { useRef } from 'react'

import { toast } from '~/components/ui/Toast'
import { HideModeText } from '~/modules/reviews/hide-mode/HideModeText'
import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { ariaKeyShortcuts } from '~/modules/shortcuts/ariaKeyShortcuts'
import { ShortcutKeys } from '~/modules/shortcuts/components/ShortcutKeys'

const styles = stylex.create({
	layout: {
		overflow: 'hidden',

		display: 'flex',
		flexDirection: 'row',

		height: '100%',
	},
	main: {
		overflow: 'hidden',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',
		minWidth: 0,
	},
	content: {
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		minHeight: 0,
		minWidth: 0,
		width: '100%',
	},
})

export function ReviewPageLayout() {
	const { hideMode, setHideMode, toggleHideMode } = useHideMode()
	const hideModeAutomaticallyActivated = useRef(false)

	useLayoutEffect(() => {
		// Automatically turn on hideMode when navigating to any of the ReviewPages.
		// (Because why would you want to see the answers when you're trying to review.)
		if (!hideModeAutomaticallyActivated.current) {
			hideModeAutomaticallyActivated.current = true
			if (hideMode !== 'on') {
				setHideMode('on')
				// The button toggles like the hotkey and leaves the toast open, so
				// the toast reads the mode instead of tracking how it changed.
				toast.add({
					actionProps: {
						'aria-keyshortcuts': ariaKeyShortcuts(
							appHotkeys.toggleHideMode,
						),
						children: (
							<>
								<HideModeText on='Turn off' off='Turn on' />
								<ShortcutKeys
									hotkey={appHotkeys.toggleHideMode}
									aria-hidden
								/>
							</>
						),
						onClick: toggleHideMode,
					},
					data: { icon: Copy },
					description: (
						<HideModeText
							on='Answers stay hidden until you reveal them'
							off='Answers and notes are showing'
						/>
					),
					title: (
						<HideModeText on='Hide mode on' off='Hide mode off' />
					),
					type: 'info',
				})
			}
		}
	}, [hideMode, setHideMode, toggleHideMode])

	return (
		<div {...stylex.props(styles.layout)}>
			<div {...stylex.props(styles.main)}>
				<div {...stylex.props(styles.content)}>
					<Outlet />
				</div>
			</div>
		</div>
	)
}
