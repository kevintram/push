import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { EntityItem } from '~/components/EntityCard'

export function useEntityNavigation(): (entity: EntityItem) => void {
	const navigate = useNavigate()

	return useCallback(
		(entity: EntityItem) => {
			switch (entity.type) {
				case 'topic':
					navigate({
						to: '/topics/$topicId',
						params: { topicId: entity.item.id.toString() }
					})
					break
				case 'source':
					navigate({
						to: '/sources/$sourceId',
						params: { sourceId: entity.item.id.toString() }
					})
					break
				case 'practice':
					navigate({
						to: '/practices/$practiceId',
						params: { practiceId: entity.item.id.toString() }
					})
					break
				default:
					break
			}
		},
		[navigate]
	)
}
