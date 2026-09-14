import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import * as stylex from '@stylexjs/stylex'

import { Badge } from '~/components/ui'
import { spacing } from '~/styles/tokens.stylex'

import { CARD_TYPE_FILTER_OPTIONS, type CardTypeFilter } from './cardTypeFilter'

const styles = stylex.create({
	group: {
		gap: spacing.sm,
		display: 'flex',
		flexWrap: 'wrap',
	},
	radio: {
		cursor: 'pointer',
	},
})

type CardTypeFilterBadgesProps = {
	value: CardTypeFilter
	onValueChange: (value: CardTypeFilter) => void
	xstyle?: stylex.StyleXStyles
}

export function CardTypeFilterBadges({
	value,
	onValueChange,
	xstyle,
}: CardTypeFilterBadgesProps) {
	return (
		<RadioGroup<CardTypeFilter>
			aria-label='Filter by card type'
			value={value}
			onValueChange={next => {
				onValueChange(next)
			}}
			{...stylex.props(styles.group, xstyle)}
		>
			{CARD_TYPE_FILTER_OPTIONS.map(option => {
				const checked = option.value === value

				return (
					<Radio.Root
						key={option.value}
						value={option.value}
						render={
							<Badge
								interactive
								variant={checked ? 'solid' : 'secondary'}
								xstyle={styles.radio}
							/>
						}
					>
						{option.label}
					</Radio.Root>
				)
			})}
		</RadioGroup>
	)
}
