import * as stylex from '@stylexjs/stylex'
import { Slash } from 'lucide-react'

import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '~/components/ui'
import { grayDark, grayLight } from '~/styles/colorPrimitives.stylex'

const DARK = '@media (prefers-color-scheme: dark)'
import { fontSizes, iconSizes, spacing } from '~/styles/tokens.stylex'

import { SpecimenSection } from './SpecimenSection'

const styles = stylex.create({
	grid: {
		columnGap: spacing['2xl'],
		rowGap: spacing.xl,

		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr)',
			'@media (min-width: 768px)': 'repeat(3, minmax(0, 1fr))',
		},
	},
	example: {
		minWidth: 0,
	},
	label: {
		marginBottom: spacing.md,

		color: { [DARK]: grayDark.s11, default: grayLight.s11 },
		fontSize: fontSizes.xs,
	},
})

export function BreadcrumbSection() {
	return (
		<SpecimenSection
			id='breadcrumb'
			title='Breadcrumb'
			meta='Basic · custom separator · collapsed'
		>
			<div {...stylex.props(styles.grid)}>
				<div {...stylex.props(styles.example)}>
					<div {...stylex.props(styles.label)}>basic</div>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href='#breadcrumb'>
									Library
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>TypeScript</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
				<div {...stylex.props(styles.example)}>
					<div {...stylex.props(styles.label)}>custom separator</div>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href='#breadcrumb'>
									Library
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator>
								<Slash aria-hidden='true' size={iconSizes.sm} />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<BreadcrumbPage>Reviews</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
				<div {...stylex.props(styles.example)}>
					<div {...stylex.props(styles.label)}>collapsed</div>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href='#breadcrumb'>
									Library
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbEllipsis />
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>Generics</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</div>
		</SpecimenSection>
	)
}
