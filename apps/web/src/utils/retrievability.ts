import type { FreshnessTier } from '~/models/learnable.types'

export function formatRetrievability(retrievability: number | null): string {
	if (retrievability === null) return '—'
	return `${Math.round(retrievability * 100)}%`
}

export function getFreshnessTierColor(
	freshnessTier: FreshnessTier | null
): string {
	if (freshnessTier === null) {
		return 'text-muted-foreground'
	}

	switch (freshnessTier) {
		case 'Fresh':
			return 'text-emerald-400 dark:text-emerald-300'
		case 'Fine':
			return 'text-sky-400 dark:text-sky-300'
		case 'Hazy':
			return 'text-amber-400 dark:text-amber-300'
		case 'Forgotten':
			return 'text-rose-400 dark:text-rose-300'
		default:
			return 'text-muted-foreground'
	}
}
