import * as stylex from '@stylexjs/stylex'
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
import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'
import { appSidebar, spacing } from '~/styles/tokens.stylex'

import {
	hideModeSidebarStyles,
	hideModeSidebarTheme,
} from './hideModeSidebarTheme'

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
	const { hideMode } = useHideMode()
	const isHideMode = hideMode === 'on'
	// The tree's menus, dialogs, and drags read as leaving or pressing
	// outside the popup, so they hold it open instead.
	const { open, onOpenChange, popupRef, hold } = useHoldablePopover()

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger
				delay={0}
				openOnHover
				render={
					<SidebarItem aria-label='Library' icon={Library} iconOnly />
				}
			/>
			<PopoverContent
				align='start'
				// Keeps the top edge on the trigger instead of shifting the
				// full-height popup up to fit.
				collisionAvoidance={{ align: 'none' }}
				ref={popupRef}
				side='right'
				// The popup portals out of the themed sidebar, so it takes the
				// hide-mode palette and fill itself.
				theme={isHideMode ? hideModeSidebarTheme : undefined}
				xstyle={[
					styles.content,
					isHideMode && hideModeSidebarStyles.surface,
					isHideMode && hideModeSidebarStyles.popup,
				]}
			>
				<PopoverHoldContext value={hold}>
					<LibraryNavigation />
				</PopoverHoldContext>
			</PopoverContent>
		</Popover>
	)
}
