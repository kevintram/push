import { describe, expect, it } from 'vitest'
import type { Note } from '~/features/notes/types/note.types'
import type { ReviewQueueItem } from '~/features/reviews/types/review-queue.types'
import {
	getActionDays,
	getThisWeekEndSubtext,
	getWeekOffsetFromActionDays,
	getWeekSectionLabel
} from './reviewWeekBuckets'

function buildNote(id: number): Note {
	return {
		id,
		title: `Note ${id}`,
		body: '',
		parent_id: null,
		parent_title: null,
		last_review_rating: null,
		fsrs_state_id: null,
		archived: false,
		inboxed: false,
		inserted_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		stability: null,
		difficulty: null,
		state: 'new',
		step: null,
		srs_enabled: true,
		last_reviewed_at: null,
		retrievability: null,
		freshness_tier: null,
		days_until_next_tier: null,
		days_in_current_tier: null,
		tags: ['TOPIC'],
		status_badges: []
	}
}

function buildDueItem(daysUntilDue: number): ReviewQueueItem {
	return {
		queue_type: 'due',
		entity_type: 'note',
		note: buildNote(1),
		review_id: 11,
		days_until_due: daysUntilDue,
		days_until_hazy: null,
		status_badges: []
	}
}

function buildHazyItem(daysUntilHazy: number): ReviewQueueItem {
	return {
		queue_type: 'hazy',
		entity_type: 'note',
		note: buildNote(2),
		review_id: null,
		days_until_due: null,
		days_until_hazy: daysUntilHazy,
		status_badges: []
	}
}

describe('reviewWeekBuckets', () => {
	it('keeps due-today items actionable today', () => {
		const actionDays = getActionDays(buildDueItem(0))
		expect(actionDays).toBe(0)
	})

	it('marks hazy-today items as overdue by action date', () => {
		const actionDays = getActionDays(buildHazyItem(0))
		expect(actionDays).toBe(-1)
	})

	it('treats hazy-tomorrow as action-today', () => {
		const actionDays = getActionDays(buildHazyItem(1))
		expect(actionDays).toBe(0)
	})

	it('calculates week offsets with Sunday week start', () => {
		const sunday = new Date('2026-02-22T12:00:00Z')
		const offset = getWeekOffsetFromActionDays(1, 0, sunday)
		expect(offset).toBe(0)
	})

	it('calculates week offsets with Monday week start', () => {
		const sunday = new Date('2026-02-22T12:00:00Z')
		const offset = getWeekOffsetFromActionDays(1, 1, sunday)
		expect(offset).toBe(1)
	})

	it('maps section labels correctly', () => {
		expect(getWeekSectionLabel(0)).toBe('This week')
		expect(getWeekSectionLabel(1)).toBe('Next week')
		expect(getWeekSectionLabel(3)).toBe('In 3 weeks')
	})

	it('returns this-week end subtext', () => {
		const sunday = 0
		const saturday = new Date('2026-02-28T12:00:00Z')
		const friday = new Date('2026-02-27T12:00:00Z')
		const monday = new Date('2026-02-23T12:00:00Z')

		expect(getThisWeekEndSubtext(sunday, saturday)).toBe('Ends Today')
		expect(getThisWeekEndSubtext(sunday, friday)).toBe('Ends Tomorrow')

		const weekdayLabel = getThisWeekEndSubtext(sunday, monday)
		expect(weekdayLabel.startsWith('Ends ')).toBe(true)
		expect(weekdayLabel).not.toBe('Ends Today')
		expect(weekdayLabel).not.toBe('Ends Tomorrow')
	})
})
