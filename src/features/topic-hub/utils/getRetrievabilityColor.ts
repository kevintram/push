export function getRetrievabilityColorClass(retrievability: number): string {
	if (retrievability >= 85) {
		return 'text-green-600'
	}
	
	if (retrievability >= 75) {
		return 'text-yellow-600'
	}
	
	if (retrievability >= 60) {
		return 'text-orange-600'
	}
	
	return 'text-red-600'
}
