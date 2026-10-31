import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'

import { SearchResultContent } from '~/modules/search/components/SearchResultContent'
import type { CollectionSearchResultItem } from '~/modules/search/utils/searchResults'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	list: {
		margin: 0,
		padding: 0,
		display: 'flex',
		flexDirection: 'column',
		listStyleType: 'none',
	},
	// Matches the search dialog's result links, as a choice rather than a link.
	result: {
		gap: '3px',
		paddingBlock: spacing.md,
		paddingInline: spacing.md,
		display: 'flex',
		flexDirection: 'column',
		inlineSize: '100%',

		borderRadius: radii.lg,
		borderWidth: 0,
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparentHover,
		},
		color: colorsSemantic.textPrimary,
		cursor: 'pointer',
		fontFamily: 'inherit',
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		textAlign: 'start',
	},
	resultSelected: {
		backgroundColor: {
			default: colorsSemantic.surfaceTransparentActive,
			':hover': colorsSemantic.surfaceTransparentActive,
		},
	},
	status: {
		margin: 0,
		paddingBlock: spacing['2xl'],
		paddingInline: spacing.xl,
		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.sm,
		textAlign: 'center',
	},
})

type MoveDestinationResultsProps = {
	isError: boolean
	isLoading: boolean
	onSelect: (collectionId: Id<'collections'>) => void
	query: string
	results: ReadonlyArray<CollectionSearchResultItem>
	selectedDestination: Id<'collections'> | null
}

export function MoveDestinationResults({
	isError,
	isLoading,
	onSelect,
	query,
	results,
	selectedDestination,
}: MoveDestinationResultsProps) {
	if (isError) {
		return (
			<p {...stylex.props(styles.status)}>
				Search could not load. Try again.
			</p>
		)
	}
	if (isLoading) {
		return <p {...stylex.props(styles.status)}>Searching…</p>
	}
	if (results.length === 0) {
		return (
			<p {...stylex.props(styles.status)}>
				No collections match “{query.trim()}”
			</p>
		)
	}

	return (
		<ul aria-label='Matching collections' {...stylex.props(styles.list)}>
			{results.map(result => {
				const isSelected = result.id === selectedDestination
				return (
					<li key={result.id}>
						<button
							type='button'
							aria-pressed={isSelected}
							onClick={() => onSelect(result.id)}
							{...stylex.props(
								styles.result,
								isSelected && styles.resultSelected,
							)}
						>
							<SearchResultContent result={result} />
						</button>
					</li>
				)
			})}
		</ul>
	)
}
