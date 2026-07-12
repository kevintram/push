import * as stylex from '@stylexjs/stylex'
import {
	Check,
	CheckCheck,
	ChevronDown,
	Construction,
	type LucideIcon,
	X,
} from 'lucide-react'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import { radii } from '~/styles/tokens.stylex'

const styles = stylex.create({
	icon: {
		backgroundColor: 'black',
		color: 'white',

		borderRadius: radii.full,
	},
})

type Rating = 'miss' | 'hard' | 'good' | 'easy'

type RatingUIOption = { label: string; icon: LucideIcon }

const RATINGS: Record<Rating, RatingUIOption> = {
	miss: { label: 'Miss', icon: X },
	hard: { label: 'Hard', icon: Construction },
	good: { label: 'Good', icon: Check },
	easy: { label: 'Easy', icon: CheckCheck },
}

type RatingDropdownProps = {
	rating: Rating
}

export function RatingDropdown({ rating }: RatingDropdownProps) {
	const Icon = RATINGS[rating].icon

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant='ghost' />}>
				<Icon {...stylex.props(styles.icon)} />
				<ChevronDown />
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{Object.entries(RATINGS).map(
					([value, { label, icon: Icon }]) => (
						<DropdownMenuItem key={value}>
							<Icon {...stylex.props(styles.icon)} />
							{label}
						</DropdownMenuItem>
					),
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
