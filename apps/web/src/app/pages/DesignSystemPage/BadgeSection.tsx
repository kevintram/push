import * as stylex from '@stylexjs/stylex'
import { BadgeCheck, Bookmark } from 'lucide-react'

import { Badge } from '~/components/ui'
import { neutral } from '~/styles/colors/primitives.stylex'

const DARK = '@media (prefers-color-scheme: dark)'
import { fontSizes, iconSizes, spacing } from '~/styles/tokens.stylex'

import { SpecimenSection } from './SpecimenSection'

const badgeVariants = [
	'solid',
	'secondary',
	'outline',
	'ghost',
	'danger',
] as const

const styles = stylex.create({
	demo: {
		gap: spacing.xl,

		display: 'flex',
		flexDirection: 'column',

		paddingBlock: spacing.xl,
		paddingInline: spacing.xl,
	},
	row: {
		gap: spacing.md,

		alignItems: 'center',
		display: 'flex',
		flexWrap: 'wrap',
	},
	label: {
		color: { [DARK]: neutral.s400, default: neutral.s600 },
		fontSize: fontSizes.sm,
		minInlineSize: '96px',
	},
})

export function BadgeSection() {
	return (
		<SpecimenSection
			id='badge'
			title='Badge'
			meta='Variants · shapes · icons'
		>
			<div {...stylex.props(styles.demo)}>
				<div {...stylex.props(styles.row)}>
					<span {...stylex.props(styles.label)}>Variants</span>
					{badgeVariants.map(variant => (
						<Badge key={variant} variant={variant}>
							{variant}
						</Badge>
					))}
				</div>
				<div {...stylex.props(styles.row)}>
					<span {...stylex.props(styles.label)}>Round</span>
					{badgeVariants.map(variant => (
						<Badge key={variant} shape='round' variant={variant}>
							{variant}
						</Badge>
					))}
				</div>
				<div {...stylex.props(styles.row)}>
					<span {...stylex.props(styles.label)}>With icon</span>
					<Badge variant='secondary'>
						<BadgeCheck aria-hidden size={iconSizes.sm} />
						Verified
					</Badge>
					<Badge variant='outline'>
						Bookmark
						<Bookmark aria-hidden size={iconSizes.sm} />
					</Badge>
				</div>
				<div {...stylex.props(styles.row)}>
					<span {...stylex.props(styles.label)}>As link</span>
					<Badge
						interactive
						render={<a href='#badge' />}
						variant='outline'
					>
						Open link
					</Badge>
				</div>
			</div>
		</SpecimenSection>
	)
}
