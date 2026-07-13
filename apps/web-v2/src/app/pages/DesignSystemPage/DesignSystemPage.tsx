import * as stylex from '@stylexjs/stylex'

import { colors, fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

import { ColorSection } from './ColorSection'
import { ComponentSection } from './ComponentSection'
import { ScaleSection } from './ScaleSection'
import {
	colorSpecimens,
	fontSizeSpecimens,
	fontWeightSpecimens,
	radiiSpecimens,
	spacingSpecimens,
} from './specimens.data'
import { TabsSection } from './TabsSection'
import { TypeSection } from './TypeSection'

const sections = [
	{ href: '#color', label: 'Color', count: colorSpecimens.length },
	{
		href: '#type',
		label: 'Type',
		count: fontSizeSpecimens.length + fontWeightSpecimens.length,
	},
	{
		href: '#scale',
		label: 'Scale',
		count: spacingSpecimens.length + radiiSpecimens.length,
	},
	{ href: '#components', label: 'Button', count: 4 },
	{ href: '#textarea', label: 'Textarea', count: 3 },
	{ href: '#dialog', label: 'Dialog', count: 1 },
	{ href: '#dropdown-menu', label: 'Dropdown menu', count: 8 },
	{ href: '#context-menu', label: 'Context menu', count: 3 },
	{ href: '#tabs', label: 'Tabs', count: 2 },
	{ href: '#toast', label: 'Toast', count: 3 },
]

const styles = stylex.create({
	page: {
		paddingBlock: {
			default: spacing['2xl'],
			'@media (min-width: 768px)': spacing['3xl'],
		},
		paddingInline: {
			default: spacing.xl,
			'@media (min-width: 768px)': spacing['2xl'],
		},

		minHeight: '100%',
		minWidth: 0,
	},
	inner: {
		marginInline: 'auto',
		maxWidth: '1180px',
		width: '100%',
	},
	hero: {
		paddingBottom: {
			default: spacing['3xl'],
			'@media (min-width: 768px)': spacing['3xl'],
		},
	},
	kicker: {
		color: colors.mutedForeground,
		fontSize: fontSizes.xs,
		letterSpacing: '0.08em',
		textTransform: 'uppercase',
	},
	title: {
		margin: 0,
		marginTop: spacing.sm,

		fontSize: {
			default: '2.25rem',
			'@media (min-width: 768px)': '2.75rem',
		},
		fontWeight: fontWeights.bold,
		letterSpacing: '-0.035em',
		lineHeight: 1,
	},
	intro: {
		gap: spacing.xl,

		alignItems: 'start',
		display: 'grid',
		gridTemplateColumns: {
			default: '1fr',
			'@media (min-width: 900px)': 'minmax(0, 1fr) auto',
		},

		marginTop: spacing.lg,
	},
	description: {
		margin: 0,

		color: colors.mutedForeground,
		fontSize: fontSizes.md,
		lineHeight: 1.55,
		maxWidth: '54ch',
	},
	index: {
		columnGap: spacing.xl,
		rowGap: spacing.sm,

		display: 'flex',
		flexWrap: 'wrap',
	},
	indexLink: {
		gap: spacing.xs,

		alignItems: 'center',
		display: 'flex',

		paddingBlock: spacing.xs,

		textDecoration: {
			default: 'none',
			':hover': 'underline',
		},
		color: colors.foreground,
		fontSize: fontSizes.sm,
		textUnderlineOffset: '3px',
	},
	indexCount: {
		color: colors.mutedForeground,
		fontSize: fontSizes.xs,
	},
	sections: {
		gap: spacing['4xl'],

		display: 'flex',
		flexDirection: 'column',
		minWidth: 0,
	},
})

export function DesignSystemPage() {
	return (
		<main {...stylex.props(styles.page)}>
			<div {...stylex.props(styles.inner)}>
				<header {...stylex.props(styles.hero)}>
					<div {...stylex.props(styles.kicker)}>
						3gulp interface / v2
					</div>
					<h1 {...stylex.props(styles.title)}>Design system</h1>
					<div {...stylex.props(styles.intro)}>
						<p {...stylex.props(styles.description)}>
							The visual language behind the study
							experience—tokens, type, spacing, and the components
							built from them.
						</p>
						<nav
							aria-label='Design system sections'
							{...stylex.props(styles.index)}
						>
							{sections.map(section => (
								<a
									key={section.href}
									href={section.href}
									{...stylex.props(styles.indexLink)}
								>
									<span>{section.label}</span>
									<span {...stylex.props(styles.indexCount)}>
										{section.count}
									</span>
								</a>
							))}
						</nav>
					</div>
				</header>

				<div {...stylex.props(styles.sections)}>
					<ColorSection />
					<TypeSection />
					<ScaleSection />
					<ComponentSection />
					<TabsSection />
				</div>
			</div>
		</main>
	)
}
