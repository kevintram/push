export function dateOf(dateStr: string | undefined | null): Date | undefined {
	return dateStr ? new Date(dateStr) : undefined
}
