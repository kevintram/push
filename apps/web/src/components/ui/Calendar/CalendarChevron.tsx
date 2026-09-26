import * as stylex from '@stylexjs/stylex'
import {
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronUpIcon,
} from 'lucide-react'

import { iconSizes } from '~/styles/tokens.stylex'

const styles = stylex.create({
	icon: { blockSize: iconSizes.md, inlineSize: iconSizes.md },
})

type CalendarChevronProps = React.ComponentProps<'svg'> & {
	orientation?: 'up' | 'down' | 'left' | 'right'
}

export function CalendarChevron({
	orientation,
	...props
}: CalendarChevronProps) {
	const Icon =
		orientation === 'left'
			? ChevronLeftIcon
			: orientation === 'right'
				? ChevronRightIcon
				: orientation === 'up'
					? ChevronUpIcon
					: ChevronDownIcon

	return <Icon {...props} {...stylex.props(styles.icon)} />
}
