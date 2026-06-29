import { reviewStatusDotVariants } from '~/components/ui/review-status-dots'
import { cn } from '~/lib/utils'

const ARC_BUTTON_SIZE = 30
const ARC_DOT_SIZE = 8
// Three fixed slots anchored at -45°: slot 1 (-67.5°), slot 2 (-45°), slot 3 (-22.5°)
// 1 dot  → slot 2 only         (anchor at -45°)
// 2 dots → slots 1 + 3         (-45° is the midpoint between them)
// 3 dots → all three slots
const ARC_SLOT_ANGLES = [-67.5, -45, -22.5] as const

function getArcAngles(count: number): Array<number> {
	if (count === 1) return [ARC_SLOT_ANGLES[1]]
	if (count === 2) return [ARC_SLOT_ANGLES[0], ARC_SLOT_ANGLES[2]]
	return [...ARC_SLOT_ANGLES]
}

function getArcPositions(count: number) {
	const cx = ARC_BUTTON_SIZE / 2
	const cy = ARC_BUTTON_SIZE / 2
	const r = ARC_BUTTON_SIZE / 2
	const half = ARC_DOT_SIZE / 2
	return getArcAngles(count).map(deg => {
		const rad = (deg * Math.PI) / 180
		return {
			left: cx + r * Math.cos(rad) - half,
			top: cy + r * Math.sin(rad) - half,
		}
	})
}

type ArcDotTone = 'danger' | 'info' | 'neutral' | 'neutral-solid'

const ARC_DOT_TESTID_SUFFIX: Record<ArcDotTone, string> = {
	danger: 'overdue-dot',
	info: 'due-today-dot',
	neutral: 'pending-dot',
	'neutral-solid': 'pending-dot',
}

export function HeaderArcIndicator({
	overdueCount,
	dueTodayCount,
	pendingCount,
	neutralVariant = 'outline',
	testIdPrefix,
}: {
	overdueCount: number
	dueTodayCount: number
	pendingCount: number
	neutralVariant?: 'outline' | 'solid'
	testIdPrefix?: string
}) {
	const dots: Array<{ tone: ArcDotTone }> = []
	if (overdueCount > 0) dots.push({ tone: 'danger' })
	if (dueTodayCount > 0) dots.push({ tone: 'info' })
	if (pendingCount > 0)
		dots.push({
			tone: neutralVariant === 'solid' ? 'neutral-solid' : 'neutral',
		})

	if (dots.length === 0) return null

	const positions = getArcPositions(dots.length)

	return (
		<>
			{dots.map((dot, i) => {
				const pos = positions[i]!
				return (
					<span
						aria-hidden={true}
						className={cn(
							reviewStatusDotVariants({
								size: 'default',
								tone: dot.tone,
							}),
							'pointer-events-none absolute z-10',
						)}
						data-testid={
							testIdPrefix
								? `${testIdPrefix}-${ARC_DOT_TESTID_SUFFIX[dot.tone]}`
								: undefined
						}
						key={dot.tone}
						style={{ left: pos.left, top: pos.top }}
					/>
				)
			})}
		</>
	)
}
