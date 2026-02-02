import { useMemo } from 'react'
import type { FsrsState } from '~/models/learnable.types'
import type { LearningState } from '~/models/learning-state.types'

interface FsrsEntity {
	fsrs_state_id: number | null
	stability: number | null
	difficulty: number | null
	state: LearningState | null
	step: number | null
	last_reviewed_at: string | null
}

export function useFsrsState(
	entity: FsrsEntity | null | undefined
): FsrsState | null {
	return useMemo(() => {
		if (!entity || entity.fsrs_state_id === null) return null
		return {
			stability: entity.stability,
			difficulty: entity.difficulty,
			state: entity.state,
			step: entity.step,
			lastReviewedAt: entity.last_reviewed_at
		}
	}, [
		entity?.fsrs_state_id,
		entity?.stability,
		entity?.difficulty,
		entity?.state,
		entity?.step,
		entity?.last_reviewed_at
	])
}
