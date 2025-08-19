import type { Tables } from '~/types/database.types'

export function getEffectiveDate(entry: Tables<'timeline_entries'>): Date {
	return new Date(getEffectiveDateAsString(entry))
}

export function getEffectiveDateAsString(entry: Tables<'timeline_entries'>): string {
	return entry.completed_at ?? entry.scheduled_at
}
