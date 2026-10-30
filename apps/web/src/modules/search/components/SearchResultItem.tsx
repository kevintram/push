import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { DialogClose } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

import type { SearchResultItem as SearchResultItemModel } from '../utils/searchResults'
import { SearchResultContent } from './SearchResultContent'

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
})

type SearchResultItemProps = {
	result: SearchResultItemModel
}

export function SearchResultItem({ result }: SearchResultItemProps) {
	const content = <SearchResultContent result={result} />

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
