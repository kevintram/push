import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { ChevronsDownUp } from 'lucide-react'

import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	Tree,
} from '~/components/ui'
import type { CollectionWithChildren } from '~/modules/collections/types/collection.types'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import {
	appSidebar,
	fontSizes,
	fontWeights,
	iconSizes,
	iconWeights,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import { MoveCollectionItem } from './MoveCollectionItem'

const styles = stylex.create({
	// Holds the header and the tree so choosing the top level highlights both,
	// as dragging onto the sidebar's Collections section does.
	root: {
		borderRadius: radii.lg,
		display: 'flex',
		flexDirection: 'column',
		minBlockSize: '100%',
	},
	rootSelected: {
		backgroundColor: colorsSemantic.surfaceTransparentHover,
	},
	// Matches the sidebar's Collections header.
	header: {
		gap: spacing.xs,
		alignItems: 'center',
		blockSize: appSidebar.rowHeight,
		display: 'flex',
		paddingInlineEnd: spacing['2xs'],
	},
	headerLabel: {
		borderRadius: radii.lg,
		borderWidth: 0,
		paddingBlock: 0,
		paddingInline: appSidebar.rowInset,
		alignItems: 'center',
		alignSelf: 'stretch',
		backgroundColor: 'transparent',
		color: colorsSemantic.textInteractive,
		display: 'flex',
		flexGrow: 1,
		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		textAlign: 'start',
	},
	headerButton: {
		color: {
			default: colorsSemantic.textInteractive,
			':hover': colorsSemantic.textInteractiveHover,
		},
		cursor: 'pointer',
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
	headerButtonSelected: {
		color: colorsSemantic.textInteractiveActive,
	},
	icon: {
		blockSize: iconSizes.sm,
		inlineSize: iconSizes.sm,
	},
})

type MoveCollectionTreeProps = {
	/** Makes the header a button that chooses the top level. */
	allowRoot?: boolean
	collections: ReadonlyArray<CollectionWithChildren>
	onCollapseAll: () => void
	onCollectionOpenChange: (
		collectionId: Id<'collections'>,
		open: boolean,
	) => void
	onSelect: (destination: Id<'collections'> | null) => void
	openCollectionIds: ReadonlySet<Id<'collections'>>
	selectedDestination: Id<'collections'> | null
	xstyle?: stylex.StyleXStyles
}

export function MoveCollectionTree({
	allowRoot = false,
	collections,
	onCollapseAll,
	onCollectionOpenChange,
	onSelect,
	openCollectionIds,
	selectedDestination,
	xstyle,
}: MoveCollectionTreeProps) {
	const isRootSelected = allowRoot && selectedDestination === null

	return (
		<div
			{...stylex.props(
				styles.root,
				isRootSelected && styles.rootSelected,
				xstyle,
			)}
		>
			<div {...stylex.props(styles.header)}>
				{allowRoot ? (
					<button
						type='button'
						aria-pressed={isRootSelected}
						onClick={() => onSelect(null)}
						{...stylex.props(
							styles.headerLabel,
							styles.headerButton,
							isRootSelected && styles.headerButtonSelected,
						)}
					>
						Collections
					</button>
				) : (
					<span {...stylex.props(styles.headerLabel)}>
						Collections
					</span>
				)}
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label='Collapse all'
								disabled={openCollectionIds.size === 0}
								iconOnly
								onClick={onCollapseAll}
								size='tiny'
								variant='ghost'
							>
								<ChevronsDownUp
									aria-hidden='true'
									strokeWidth={iconWeights.medium}
									{...stylex.props(styles.icon)}
								/>
							</Button>
						}
					/>
					<TooltipContent>Collapse all</TooltipContent>
				</Tooltip>
			</div>
			<Tree>
				{collections.map(collection => (
					<MoveCollectionItem
						key={collection._id}
						{...collection}
						onSelect={onSelect}
						selectedCollectionId={selectedDestination}
						openCollectionIds={openCollectionIds}
						onCollectionOpenChange={onCollectionOpenChange}
					/>
				))}
			</Tree>
		</div>
	)
}
