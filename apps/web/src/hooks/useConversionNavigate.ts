import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

export type OnConversionSuccess = (
	targetEntityType: 'topic' | 'source' | 'practice',
	newEntityId: number
) => void

export function useConversionNavigate() {
	const navigate = useNavigate()
	return useCallback(
		(
			targetEntityType: 'topic' | 'source' | 'practice',
			newEntityId: number
		) => {
			const routes = {
				topic: {
					to: '/topics/$topicId',
					params: { topicId: String(newEntityId) }
				},
				source: {
					to: '/sources/$sourceId',
					params: { sourceId: String(newEntityId) }
				},
				practice: {
					to: '/practices/$practiceId',
					params: { practiceId: String(newEntityId) }
				}
			} as const
			navigate({ ...routes[targetEntityType], replace: true })
		},
		[navigate]
	)
}
