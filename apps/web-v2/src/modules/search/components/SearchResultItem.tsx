import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { DialogClose } from '~/components/ui'
import { searchResultItemColors } from '~/styles/componentColors.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import type { SearchResultItem as SearchResultItemModel } from '../utils/searchResults'

const styles = stylex.create({
	item: {
		listStyle: 'none',
	},
	link: {
		gap: '3px',
		paddingBlock: spacing.md,
		paddingInline: spacing.md,
		display: 'flex',
		flexDirection: 'column',

		borderRadius: radii.lg,
		textDecoration: 'none',
		backgroundColor: {
			default: searchResultItemColors.background,
			':focus-visible': searchResultItemColors.backgroundFocusVisible,
			':hover': searchResultItemColors.backgroundHover,
		},
		color: searchResultItemColors.foreground,
		outlineColor: {
			default: searchResultItemColors.focusRingRest,
			':focus-visible': searchResultItemColors.focusRing,
		},
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
	title: {
		overflow: 'hidden',
		fontSize: fontSizes.md,
		fontWeight: fontWeights.medium,
		lineHeight: 1.4,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	secondary: {
		overflow: 'hidden',
		color: searchResultItemColors.secondaryForeground,
		fontSize: fontSizes.sm,
		lineHeight: 1.4,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	path: {
		overflow: 'hidden',
		color: searchResultItemColors.pathForeground,
		fontSize: fontSizes.xs,
		lineHeight: 1.4,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
})

type SearchResultItemProps = {
	result: SearchResultItemModel
}

export function SearchResultItem({ result }: SearchResultItemProps) {
	const content = (
		<>
			<span {...stylex.props(styles.path)}>{result.pathText}</span>
			<span {...stylex.props(styles.title)}>{result.title}</span>
			{result.secondaryText ? (
				<span {...stylex.props(styles.secondary)}>
					{result.secondaryText}
				</span>
			) : null}
		</>
	)

	return (
		<li {...stylex.props(styles.item)}>
			{result.kind === 'topic' ? (
				<DialogClose
					render={
						<Link
							params={{ topicId: result.id }}
							to='/library/$topicId'
						/>
					}
					{...stylex.props(styles.link)}
				>
					{content}
				</DialogClose>
			) : (
				<DialogClose
					render={
						<Link
							params={{ reviewCardId: result.id }}
							to='/review-cards/$reviewCardId'
						/>
					}
					{...stylex.props(styles.link)}
				>
					{content}
				</DialogClose>
			)}
		</li>
	)
}
