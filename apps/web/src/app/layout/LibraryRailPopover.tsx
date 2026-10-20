import * as stylex from '@stylexjs/stylex'
import { useMatchRoute } from '@tanstack/react-router'
import { Library } from 'lucide-react'

import { SidebarItem } from '~/components/sidebar'
import {
	Popover,
	PopoverContent,
	PopoverHoldContext,
	PopoverTrigger,
	useHoldablePopover,
} from '~/components/ui'
import { LibraryNavigation } from '~/modules/library/components/library-navigation/LibraryNavigation'
import { appSidebar, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	// Runs from the trigger to the bottom of the viewport.
	content: {
		padding: spacing.xs,

		blockSize: 'var(--available-height)',
		display: 'flex',
		inlineSize: appSidebar.width,
	},
})

/**
 * Opens the library tree beside the collapsed rail on hover, so collections
 * stay reachable without expanding the sidebar.
 */
export function LibraryRailPopover() {
	const matchRoute = useMatchRoute()
	const isActive = Boolean(matchRoute({ to: '/library', fuzzy: true }))
	// The tree's menus and dialogs portal outside the popup, so using them
	// reads as leaving or pressing outside it. They hold it open instead.
	const { open, onOpenChange, popupRef, hold } = useHoldablePopover()

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger
				delay={0}
				openOnHover
				render={
					<SidebarItem
						active={isActive}
						aria-label='Library'
						icon={Library}
						iconOnly
					/>
				}
			/>
			<PopoverContent
				align='start'
				// Keeps the top edge on the trigger instead of shifting the
				// full-height popup up to fit.
				collisionAvoidance={{ align: 'none' }}
				ref={popupRef}
				side='right'
				xstyle={styles.content}
			>
				<PopoverHoldContext value={hold}>
					<LibraryNavigation />
				</PopoverHoldContext>
			</PopoverContent>
		</Popover>
	)
}
