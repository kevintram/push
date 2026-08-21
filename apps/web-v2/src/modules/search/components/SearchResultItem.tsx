import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { DialogClose } from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
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
			default: colors.bgSurfaceTransparent,
			':focus-visible': colors.bgSurfaceHover,
			':hover': colors.bgSurfaceHover,
		},
		color: colors.text,
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.borderFocus,
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
		color: colors.textSecondary,
		fontSize: fontSizes.sm,
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
