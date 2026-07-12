import * as stylex from '@stylexjs/stylex'

import { colors, fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

import { colorSpecimens } from './specimens.data'
import { SpecimenSection } from './SpecimenSection'

const styles = stylex.create({
	columnLabels: {
		gap: spacing.lg,

		display: {
			default: 'none',
			'@media (min-width: 760px)': 'grid',
		},
		gridTemplateColumns: 'minmax(170px, 0.7fr) repeat(2, minmax(0, 1fr))',

		paddingInline: spacing.md,
		paddingBottom: spacing.sm,

		color: colors.mutedForeground,
		fontSize: fontSizes.xs,
		letterSpacing: '0.06em',
		textTransform: 'uppercase',
	},
	list: {
		gap: spacing.xs,

		display: 'flex',
		flexDirection: 'column',
	},
	row: {
		gap: {
			default: spacing.md,
			'@media (min-width: 760px)': spacing.lg,
		},

		display: 'grid',
		gridTemplateColumns: {
			default: '1fr 1fr',
			'@media (min-width: 760px)':
				'minmax(170px, 0.7fr) repeat(2, minmax(0, 1fr))',
		},

		borderBottomWidth: 0,
		borderLeftWidth: 0,
		borderRightWidth: 0,
		borderTopWidth: 0,

		paddingBlock: spacing.md,
		paddingInline: spacing.none,
		width: '100%',

		backgroundColor: {
			default: 'transparent',
			':hover': colors.muted,
		},
		color: colors.foreground,
		cursor: 'pointer',
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.focusRing,
		},
		outlineOffset: '-3px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		textAlign: 'left',
		transform: {
			default: 'scale(1)',
			':active': 'scale(0.995)',
		},
		transitionDuration: '140ms',
		transitionProperty: 'background-color, transform',
		transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
	},
	identity: {
		gap: spacing.xs,

		gridColumn: {
			default: '1 / -1',
			'@media (min-width: 760px)': 'auto',
		},
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		minWidth: 0,
	},
	name: {
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
	},
	role: {
		color: colors.mutedForeground,
		fontSize: fontSizes.xs,
	},
	swatch: {
		overflow: 'hidden',

		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'end',

		height: {
			default: '64px',
			'@media (min-width: 760px)': '72px',
		},
		minWidth: 0,
	},
	value: {
		paddingBlock: spacing.xs,
		paddingInline: spacing.sm,

		overflow: 'hidden',
		backgroundColor: colors.surface,
		color: colors.mutedForeground,
		fontSize: '0.6875rem',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
})

function copyToken(name: string) {
	navigator.clipboard?.writeText(`colors.${name}`)
}

export function ColorSection() {
	return (
		<SpecimenSection
			id='color'
			title='Color'
			meta={`${colorSpecimens.length} semantic tokens · select a row to copy`}
		>
			<div aria-hidden {...stylex.props(styles.columnLabels)}>
				<span>Token</span>
				<span>Light</span>
				<span>Dark</span>
			</div>
			<div {...stylex.props(styles.list)}>
				{colorSpecimens.map(token => (
					<button
						key={token.name}
						type='button'
						onClick={() => copyToken(token.name)}
						title={`Copy colors.${token.name}`}
						{...stylex.props(styles.row)}
					>
						<span {...stylex.props(styles.identity)}>
							<span {...stylex.props(styles.name)}>
								{token.name}
							</span>
							<span {...stylex.props(styles.role)}>
								{token.role}
							</span>
						</span>
						<span
							className={stylex.props(styles.swatch).className}
							style={{ backgroundColor: token.light }}
						>
							<span {...stylex.props(styles.value)}>
								{token.light}
							</span>
						</span>
						<span
							className={stylex.props(styles.swatch).className}
							style={{ backgroundColor: token.dark }}
						>
							<span {...stylex.props(styles.value)}>
								{token.dark}
							</span>
						</span>
					</button>
				))}
			</div>
		</SpecimenSection>
	)
}
