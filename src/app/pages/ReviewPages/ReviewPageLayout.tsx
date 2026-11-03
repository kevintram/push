import * as stylex from '@stylexjs/stylex'
import { Outlet, useLayoutEffect } from '@tanstack/react-router'
import { Copy } from 'lucide-react'
import { useRef } from 'react'

import { toast } from '~/components/ui/Toast'
import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'

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
	const { hideMode, setHideMode } = useHideMode()
	const hideModeAutomaticallyActivated = useRef(false)

	useLayoutEffect(() => {
		// Automatically turn on hideMode when navigating to any of the ReviewPages.
		// (Because why would you want to see the answers when you're trying to review.)
		if (!hideModeAutomaticallyActivated.current) {
			hideModeAutomaticallyActivated.current = true
			if (hideMode !== 'on') {
				setHideMode('on')
				const id = toast.add({
					actionProps: {
						children: 'Turn off',
						onClick: () => {
							toast.close(id)
							setHideMode('off')
						},
					},
					data: { icon: Copy },
					description: 'Answers stay hidden until you reveal them',
					title: 'Hide mode on',
					type: 'info',
				})
			}
		}
	}, [hideMode, setHideMode])

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
