/** `n` and `noun`, made plural with an "s" unless `n` is 1: "1 card", "3 cards". */
export function pluralize(n: number, noun: string): string {
	return `${n} ${noun}${n === 1 ? '' : 's'}`
}
