import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Check, Ellipsis } from 'lucide-react'

import { ButtonIcon } from '~/components/ui'
import { type ReviewCard } from '~/modules/reviews/types/review.types'
import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		paddingBlock: spacing.lg,

		gap: spacing.md,
		display: 'flex',
		flexDirection: 'column',

		borderBottomColor: colors.borderSecondary,
		borderBottomStyle: 'solid',
		borderBottomWidth: '1px',

		textDecoration: 'none',
		color: colors.text,
	},
	titleRow: {
		gap: spacing.md,
		alignItems: 'center',
		display: 'flex',
	},
	title: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontSize: fontSizes.md,
		fontWeight: fontWeights.semibold,
	},
	titleAction: {
		flexShrink: 0,
	},
	description: {
		fontSize: fontSizes.sm,
	},
	metadata: {
		gap: spacing.xl,
		alignItems: 'center',
		display: 'flex',
		fontSize: fontSizes.sm,
	},
	metadataItem: {
		gap: spacing.xs,
		alignItems: 'center',
		color: colors.textSecondary,
		display: 'inline-flex',
		fontWeight: fontWeights.semibold,
		whiteSpace: 'nowrap',
	},
})

export function ReviewCard({ id, primary_text, secondary_text }: ReviewCard) {
	return (
		<Link
			to='/review-cards/$reviewCardId'
			params={{ reviewCardId: id }}
			{...stylex.props(styles.container)}
		>
			<div {...stylex.props(styles.titleRow)}>
				<p {...stylex.props(styles.title)}>{primary_text}</p>

				<ButtonIcon
					shape='round'
					variant='ghost'
					size='small'
					xstyle={styles.titleAction}
				>
					<Ellipsis size={iconSizes.md} />
				</ButtonIcon>
			</div>

			{secondary_text ? (
				<p {...stylex.props(styles.description)}>{secondary_text}</p>
			) : null}

			<div {...stylex.props(styles.metadata)}>
				<span {...stylex.props(styles.metadataItem)}>Hazy</span>
				<span {...stylex.props(styles.metadataItem)}>Due in 8d</span>
				<span {...stylex.props(styles.metadataItem)}>
					<Check size={iconSizes.md} />
					8d ago
				</span>
				<span {...stylex.props(styles.metadataItem)}>
					Durable for 16d
				</span>
			</div>
		</Link>
	)
}
