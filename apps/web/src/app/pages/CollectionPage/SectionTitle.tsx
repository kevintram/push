import type { Section } from '@convex/validators/sections'
import * as stylex from '@stylexjs/stylex'
import { type KeyboardEvent, useCallback } from 'react'

import { Textarea } from '~/components/ui'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useUpdateSection } from '~/modules/collections/api/sectionQueries'

// Typography comes from the section's h3, set by `CardList`.
const styles = stylex.create({
	title: {
		// Drops the textarea's border so the title lines up with the card titles.
		borderWidth: 0,

		color: 'inherit',
		letterSpacing: 'inherit',
	},
})

type SectionTitleProps = {
	section: Section
	/** Focuses the title on mount, so a new section can be named right away. */
	autoFocus?: boolean
}

/** A section's title, edited in place and saved as the user types. */
export function SectionTitle({ section, autoFocus }: SectionTitleProps) {
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
	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLTextAreaElement>) => {
			if (event.key !== 'Enter') return

			event.preventDefault()
			event.currentTarget.blur()
		},
		[],
	)

	return (
		<Textarea
			aria-label='Section title'
			autoFocus={autoFocus}
			placeholder='Untitled section'
			rows={1}
			onBlur={title.flush}
			onChange={title.onChange}
			onKeyDown={handleKeyDown}
			value={title.value}
			xstyle={styles.title}
		/>
	)
}
