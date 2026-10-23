import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { DialogClose } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
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
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.surfaceTransparentActive,
			':hover': colorsSemantic.surfaceTransparentHover,
		},
		color: colorsSemantic.textPrimary,
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
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
		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.sm,
		lineHeight: 1.4,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	path: {
		overflow: 'hidden',
		color: colorsSemantic.textSecondary,
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
			{result.kind === 'collection' ? (
				<DialogClose
					nativeButton={false}
					render={
						<Link
							params={{ collectionId: result.id }}
							role='link'
							to='/collection/$collectionId'
						/>
					}
					{...stylex.props(styles.link)}
				>
					{content}
				</DialogClose>
			) : (
				<DialogClose
					nativeButton={false}
					render={
						<Link
							params={{ cardId: result.id }}
							role='link'
							to='/cards/$cardId'
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
