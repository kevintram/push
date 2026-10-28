import type { Section } from '@convex/validators/sections'
import * as stylex from '@stylexjs/stylex'
import { type KeyboardEvent, useCallback } from 'react'

import { Textarea } from '~/components/ui'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useUpdateSection } from '~/modules/collections/api/sectionQueries'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { layout, radii, spacing } from '~/styles/tokens.stylex'

// Typography comes from the section's h3, set by `CardList`.
const styles = stylex.create({
	title: {
		// Drops the textarea's border so the title lines up with the card titles.
		borderWidth: 0,

		color: 'inherit',
		letterSpacing: 'inherit',
	},
	// The title as shown when not renaming. It bleeds past the text like a card
	// row, so the text stays where the textarea puts it.
	label: {
		marginBlock: `calc(${spacing['2xs']} * -1)`,
		marginInline: `calc(${layout.rowBleed} * -1)`,
		paddingBlock: spacing['2xs'],
		paddingInline: layout.rowBleed,
		display: 'block',
		inlineSize: `calc(100% + ${layout.rowBleed} * 2)`,

		fontFamily: 'inherit',
		fontSize: 'inherit',
		fontWeight: 'inherit',
		letterSpacing: 'inherit',
		lineHeight: 'inherit',
		textAlign: 'start',

		borderRadius: radii.md,
		borderWidth: 0,
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparentHover,
		},
		color: 'inherit',
		cursor: 'default',

		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
	selected: {
		backgroundColor: {
			default: colorsSemantic.surfaceTransparentActive,
			':hover': colorsSemantic.surfaceTransparentActive,
		},
	},
	untitled: {
		color: colorsSemantic.textSecondary,
	},
})

type SectionTitleProps = {
	section: Section
	isSelected: boolean
	/** Shows the title as a field, focused, until Enter, Escape, or blur. */
	isRenaming: boolean
	onSelect: () => void
	onRename: () => void
	onRenameEnd: () => void
}

/**
 * A section's title. A click selects the section and a double click renames
 * it in place, saving as the user types.
 */
export function SectionTitle({
	section,
	isSelected,
	isRenaming,
	onSelect,
	onRename,
	onRenameEnd,
}: SectionTitleProps) {
	const updateSection = useUpdateSection()

	const saveTitle = useCallback(
		(title: string) => {
			if (title === section.title) return

			updateSection.mutate({ sectionId: section._id, title })
		},
		[section, updateSection],
	)

	const title = useAutoSave({
		initialValue: section.title,
		key: `${section._id}:title`,
		onSave: saveTitle,
	})

	// A title is one line, so Enter commits it instead of adding a newline.
	// Escape also ends renaming; the title has been saving all along.
	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLTextAreaElement>) => {
			if (event.key !== 'Enter' && event.key !== 'Escape') return

			event.preventDefault()
			event.currentTarget.blur()
		},
		[],
	)

	if (isRenaming) {
		return (
			<Textarea
				aria-label='Section title'
				autoFocus
				placeholder='Untitled section'
				rows={1}
				onBlur={() => {
					title.flush()
					onRenameEnd()
				}}
				onChange={title.onChange}
				onFocus={event => event.currentTarget.select()}
				onKeyDown={handleKeyDown}
				value={title.value}
				xstyle={styles.title}
			/>
		)
	}

	return (
		<button
			type='button'
			data-section-id={section._id}
			onClick={onSelect}
			onDoubleClick={onRename}
			{...stylex.props(
				styles.label,
				isSelected && styles.selected,
				!title.value && styles.untitled,
			)}
		>
			{title.value || 'Untitled section'}
		</button>
	)
}
