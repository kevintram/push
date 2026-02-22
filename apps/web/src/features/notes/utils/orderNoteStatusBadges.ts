import type { NoteStatusBadge } from '../types/note.types'

export function orderNoteStatusBadges(
	badges: Array<NoteStatusBadge>
): Array<NoteStatusBadge> {
	if (badges.length <= 1) return badges

	const leadingBadges: Array<NoteStatusBadge> = []
	const hazyBadges: Array<NoteStatusBadge> = []
	const forgottenBadges: Array<NoteStatusBadge> = []
	const dueBadges: Array<NoteStatusBadge> = []

	for (const badge of badges) {
		if (badge.key === 'due') {
			dueBadges.push(badge)
			continue
		}
		if (badge.key === 'hazy_soon' || badge.key === 'hazy_for') {
			hazyBadges.push(badge)
			continue
		}
		if (badge.key === 'forgotten_soon' || badge.key === 'forgotten_for') {
			forgottenBadges.push(badge)
			continue
		}
		leadingBadges.push(badge)
	}

	if (dueBadges.length === 0 && forgottenBadges.length === 0) {
		return badges
	}

	return [...leadingBadges, ...hazyBadges, ...forgottenBadges, ...dueBadges]
}
