import * as stylex from '@stylexjs/stylex'
import { useLayoutEffect, useRef } from 'react'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { scrollFade } from '~/styles/scrollFade'
import { scrollFadeVars } from '~/styles/scrollFade.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

import { MoveCollectionTree } from './MoveCollectionTree'
import type { MoveDestination } from './useMoveDestination'

const styles = stylex.create({
	// The border sits on the frame so the scroll fade dissolves the rows
	// without fading the border.
	frame: {
		borderColor: colorsSemantic.borderSubtle,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		overflow: 'hidden',
		display: 'flex',
		flexDirection: 'column',
		maxBlockSize: '24rem',
	},
	scrollArea: {
		padding: spacing.sm,
		flexGrow: 1,
		minBlockSize: 0,
		// Keeps revealed rows clear of the edge fades.
		scrollPaddingBlockEnd: scrollFadeVars.size,
		scrollPaddingBlockStart: scrollFadeVars.size,
		overflowY: 'auto',
	},
	status: {
		margin: 0,
		padding: spacing.sm,
		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.sm,
	},
})

type MoveDestinationPickerProps = {
	allowRoot: boolean
	destination: MoveDestination
}

/** Chooses a destination by browsing the collection tree. */
export function MoveDestinationPicker({
	allowRoot,
	destination,
}: MoveDestinationPickerProps) {
	const { collections, selectedDestination } = destination
	const scrollAreaRef = useRef<HTMLElement>(null)

	// The tree mounts scrolled to the top, so scroll to the selection, whose
	// branch is already open by then.
	const isShowingTree = collections.roots.length > 0
	useLayoutEffect(() => {
		if (!isShowingTree) return
		scrollAreaRef.current
			?.querySelector<HTMLElement>('[aria-pressed="true"]')
			?.scrollIntoView({ block: 'nearest' })
	}, [isShowingTree])

	return (
		<div {...stylex.props(styles.frame)}>
			<nav
				aria-label='Destination collection'
				ref={scrollAreaRef}
				{...stylex.props(styles.scrollArea, scrollFade.y)}
			>
				{collections.isPending ? (
					<p {...stylex.props(styles.status)}>Loading collections…</p>
				) : collections.isError ? (
					<p {...stylex.props(styles.status)}>
						Could not load collections.
					</p>
				) : collections.roots.length === 0 ? (
					<p {...stylex.props(styles.status)}>
						No collections available.
					</p>
				) : (
					<MoveCollectionTree
						allowRoot={allowRoot}
						collections={collections.roots}
						onCollectionOpenChange={destination.setCollectionOpen}
						onSelect={destination.setSelectedDestination}
						openCollectionIds={destination.openCollectionIds}
						selectedDestination={selectedDestination}
					/>
				)}
			</nav>
		</div>
	)
}
