import * as stylex from '@stylexjs/stylex'
import { Search } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, iconSizes, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	bar: {
		gap: spacing.sm,
		paddingBlock: spacing.sm,
		alignItems: 'center',
		display: 'flex',
		// Puts the search icon on the tree's chevron column.
		paddingInlineEnd: spacing.sm,
		paddingInlineStart: spacing.lg,

		borderBlockEndColor: colorsSemantic.borderSubtle,
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
	},
	icon: {
		blockSize: iconSizes.sm,
		color: colorsSemantic.textSecondary,
		flexShrink: 0,
		inlineSize: iconSizes.sm,
	},
	input: {
		flexGrow: 1,
		inlineSize: '100%',
		minInlineSize: 0,

		padding: 0,
		borderWidth: 0,
		outline: 'none',
		appearance: 'none',
		backgroundColor: colorsSemantic.surfaceTransparent,
		color: colorsSemantic.textPrimary,
		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		lineHeight: 1.4,
		// `appearance: none` on the input does not remove Chrome's clear button.
		'::-webkit-search-cancel-button': { display: 'none' },
		'::placeholder': {
			color: colorsSemantic.textSecondary,
		},
	},
	clear: {
		flexShrink: 0,
	},
	// Keeps its space so nothing shifts when the first character is typed.
	clearHidden: {
		visibility: 'hidden',
	},
})

type MoveDestinationSearchBarProps = {
	onQueryChange: (query: string) => void
	query: string
}

export function MoveDestinationSearchBar({
	onQueryChange,
	query,
}: MoveDestinationSearchBarProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const hasInput = query !== ''

	const handleClear = () => {
		onQueryChange('')
		inputRef.current?.focus()
	}

	return (
		<div {...stylex.props(styles.bar)}>
			<Search aria-hidden='true' {...stylex.props(styles.icon)} />
			<input
				aria-label='Search collections'
				autoComplete='off'
				enterKeyHint='search'
				onChange={event => onQueryChange(event.target.value)}
				// Escape clears the search first, so it doesn't close the dialog
				// and drop the chosen destination. An empty search lets it close.
				onKeyDown={event => {
					if (event.key !== 'Escape' || !hasInput) return
					event.preventDefault()
					event.stopPropagation()
					onQueryChange('')
				}}
				placeholder='Search collections…'
				ref={inputRef}
				// `type='search'` carries the `searchbox` role implicitly.
				type='search'
				value={query}
				{...stylex.props(styles.input)}
			/>
			<Button
				aria-hidden={!hasInput}
				aria-label='Clear search'
				disabled={!hasInput}
				onClick={handleClear}
				size='tiny'
				variant='ghost'
				xstyle={[styles.clear, !hasInput && styles.clearHidden]}
			>
				Clear
			</Button>
		</div>
	)
}
