export type Rollback = () => void

export type OptimisticContext = {
	rollback: Rollback
}

export function combineRollbacks(rollbacks: Array<Rollback>): Rollback {
	return () => {
		for (const rollback of rollbacks.toReversed()) rollback()
	}
}
