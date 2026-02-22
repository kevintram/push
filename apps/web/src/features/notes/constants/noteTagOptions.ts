import type { NoteTag } from '../types/note.types'

export const NOTE_TAG_OPTIONS: Array<{ value: NoteTag; label: string }> = [
	{ value: 'TOPIC', label: 'Topic' },
	{ value: 'SOURCE', label: 'Source' },
	{ value: 'PRACTICE', label: 'Practice' }
]

const TAG_ORDER: Record<NoteTag, number> = {
	TOPIC: 0,
	SOURCE: 1,
	PRACTICE: 2
}

export function normalizeNoteTags(tags: Array<NoteTag>): Array<NoteTag> {
	return [...new Set(tags)].sort((a, b) => TAG_ORDER[a] - TAG_ORDER[b])
}

export function getNoteTagButtonLabel(tags: Array<NoteTag>): string {
	if (tags.length === 0) return 'Tags'
	if (tags.length === 1) {
		return (
			NOTE_TAG_OPTIONS.find(option => option.value === tags[0])?.label ?? 'Tags'
		)
	}
	return `Tags (${tags.length})`
}
