import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, fontWeights } from '~/styles/tokens.stylex'

import type { SearchResultItem } from '../utils/searchResults'

const styles = stylex.create({
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

type SearchResultContentProps = {
	result: Pick<SearchResultItem, 'pathText' | 'secondaryText' | 'title'>
}

/**
 * A search result's path, title, and secondary text, stacked. The element
 * around it sets the layout and what the result does.
 */
export function SearchResultContent({ result }: SearchResultContentProps) {
	return (
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
}
