import * as stylex from '@stylexjs/stylex'
import { useMatchRoute } from '@tanstack/react-router'
import { Library } from 'lucide-react'

import { SidebarItem } from '~/components/sidebar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui'
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

	return (
		<Popover>
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
				side='right'
				xstyle={styles.content}
			>
				<LibraryNavigation />
			</PopoverContent>
		</Popover>
	)
}
