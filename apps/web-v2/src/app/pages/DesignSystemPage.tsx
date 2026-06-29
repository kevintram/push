import * as stylex from '@stylexjs/stylex'
import { Check, Layers3, Palette, Ruler } from 'lucide-react'

import { styles } from './DesignSystemPage.stylex'

const foundationSections = [
	{
		id: 'color',
		label: 'Color',
		icon: Palette,
		description:
			'Application surfaces, text, borders, and interaction color.',
	},
	{
		id: 'typography',
		label: 'Typography',
		icon: Layers3,
		description:
			'Font family, size, and weight tokens currently available.',
	},
	{
		id: 'spacing',
		label: 'Spacing',
		icon: Ruler,
		description:
			'The compact spacing scale used by the app shell and controls.',
	},
]

const colorTokens = [
	{
		name: 'background',
		value: 'oklch(97.00% 0.0082 91.48)',
		usage: 'Page background',
	},
	{
		name: 'foreground',
		value: 'oklch(20.46% 0 none)',
		usage: 'Primary text',
	},
	{
		name: 'primary',
		value: 'oklch(20.46% 0 none)',
		usage: 'Primary actions',
	},
	{
		name: 'mutedForeground',
		value: 'oklch(50.28% 0.0112 93.69)',
		usage: 'Secondary text',
	},
	{
		name: 'surface',
		value: 'oklch(100.00% 0 none)',
		usage: 'Raised surfaces',
	},
	{
		name: 'surfaceHover',
		value: 'oklch(94.90% 0.0083 91.48)',
		usage: 'Subtle hover fill',
	},
	{
		name: 'border',
		value: 'oklch(88.59% 0.0171 88.01)',
		usage: 'Dividers and outlines',
	},
	{
		name: 'focusRing',
		value: 'oklch(50.15% 0.0845 168.71)',
		usage: 'Keyboard focus',
	},
]

const typographyTokens = [
	{
		name: 'font.family',
		value: 'Inter, ui-sans-serif, system-ui',
		usage: 'Default interface typeface',
	},
	{ name: 'fontSize.sm', value: '0.875rem', usage: 'Compact labels' },
	{ name: 'fontSize.md', value: '1rem', usage: 'Body text' },
	{ name: 'fontSize.lg', value: '1.125rem', usage: 'Introductory copy' },
	{ name: 'fontWeight.regular', value: '400', usage: 'Body copy' },
	{ name: 'fontWeight.medium', value: '500', usage: 'Controls and labels' },
	{ name: 'fontWeight.bold', value: '750', usage: 'Headings' },
]

const spacingTokens = [
	{ name: 'space.1', value: '0.25rem' },
	{ name: 'space.2', value: '0.5rem' },
	{ name: 'space.3', value: '0.75rem' },
	{ name: 'space.4', value: '1rem' },
	{ name: 'space.5', value: '1.5rem' },
	{ name: 'space.6', value: '2rem' },
]

const radiusTokens = [
	{ name: 'radius.sm', value: '4px' },
	{ name: 'radius.md', value: '6px' },
	{ name: 'radius.lg', value: '8px' },
]

const navItems = [
	{ href: '#overview', label: 'Overview' },
	{ href: '#foundations', label: 'Foundations' },
	{ href: '#tokens', label: 'Tokens' },
	{ href: '#decisions', label: 'Decisions' },
]

export function DesignSystemPage() {
	return (
		<main {...stylex.props(styles.page)}>
			<aside
				aria-label='Design system navigation'
				{...stylex.props(styles.sidebar)}
			>
				<div {...stylex.props(styles.sidebarHeader)}>
					<div {...stylex.props(styles.mark)}>3g</div>
					<div>
						<p {...stylex.props(styles.sidebarEyebrow)}>web-v2</p>
						<h1 {...stylex.props(styles.sidebarTitle)}>
							Design System
						</h1>
					</div>
				</div>
				<nav {...stylex.props(styles.navList)}>
					{navItems.map(item => (
						<a
							href={item.href}
							key={item.href}
							{...stylex.props(styles.navLink)}
						>
							{item.label}
						</a>
					))}
				</nav>
			</aside>

			<div {...stylex.props(styles.contentGrid)}>
				<article {...stylex.props(styles.content)}>
					<section {...stylex.props(styles.hero)} id='overview'>
						<p {...stylex.props(styles.eyebrow)}>
							Internal workbench
						</p>
						<div {...stylex.props(styles.heroCopy)}>
							<h2 {...stylex.props(styles.heroTitle)}>
								3gulp design system
							</h2>
							<p {...stylex.props(styles.heroText)}>
								A dev-only reference for the foundations that
								exist in{' '}
								<code {...stylex.props(styles.inlineCode)}>
									apps/web-v2
								</code>{' '}
								today. This page should grow only when the
								implementation grows.
							</p>
						</div>
						<div {...stylex.props(styles.statusRow)}>
							<span {...stylex.props(styles.statusPill)}>
								<Check
									aria-hidden='true'
									{...stylex.props(styles.icon)}
								/>
								DEV only
							</span>
							<span {...stylex.props(styles.statusPill)}>
								Base UI
							</span>
							<span {...stylex.props(styles.statusPill)}>
								StyleX
							</span>
						</div>
					</section>

					<section {...stylex.props(styles.section)} id='foundations'>
						<div {...stylex.props(styles.sectionHeader)}>
							<p {...stylex.props(styles.eyebrow)}>Foundations</p>
							<h2 {...stylex.props(styles.sectionTitle)}>
								Current foundations
							</h2>
							<p {...stylex.props(styles.sectionText)}>
								These values mirror the active tokens in{' '}
								<code {...stylex.props(styles.inlineCode)}>
									theme.stylex.ts
								</code>
								.
							</p>
						</div>

						<div {...stylex.props(styles.foundationGrid)}>
							{foundationSections.map(section => {
								const Icon = section.icon
								return (
									<div
										key={section.id}
										{...stylex.props(styles.foundationCard)}
									>
										<div
											{...stylex.props(
												styles.foundationIcon,
											)}
										>
											<Icon
												aria-hidden='true'
												{...stylex.props(styles.icon)}
											/>
										</div>
										<div>
											<h3
												{...stylex.props(
													styles.cardTitle,
												)}
											>
												{section.label}
											</h3>
											<p
												{...stylex.props(
													styles.cardText,
												)}
											>
												{section.description}
											</p>
										</div>
									</div>
								)
							})}
						</div>
					</section>

					<section {...stylex.props(styles.section)} id='tokens'>
						<div {...stylex.props(styles.sectionHeader)}>
							<p {...stylex.props(styles.eyebrow)}>Tokens</p>
							<h2 {...stylex.props(styles.sectionTitle)}>
								Current token set
							</h2>
						</div>

						<div {...stylex.props(styles.panel)} id='color'>
							<h3 {...stylex.props(styles.subsectionTitle)}>
								Color
							</h3>
							<div {...stylex.props(styles.colorGrid)}>
								{colorTokens.map(token => (
									<div
										key={token.name}
										{...stylex.props(styles.colorToken)}
									>
										<div
											aria-label={`${token.name} ${token.value}`}
											{...stylex.props(
												styles.swatch,
												styles.swatchColor(token.value),
											)}
										/>
										<div
											{...stylex.props(styles.tokenMeta)}
										>
											<span
												{...stylex.props(
													styles.tokenName,
												)}
											>
												{token.name}
											</span>
											<span
												{...stylex.props(
													styles.tokenValue,
												)}
											>
												{token.value}
											</span>
											<span
												{...stylex.props(
													styles.tokenUsage,
												)}
											>
												{token.usage}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>

						<div {...stylex.props(styles.splitGrid)}>
							<div {...stylex.props(styles.panel)}>
								<h3 {...stylex.props(styles.subsectionTitle)}>
									Typography
								</h3>
								<div {...stylex.props(styles.scaleList)}>
									{typographyTokens.map(token => (
										<div
											key={token.name}
											{...stylex.props(styles.tokenMeta)}
										>
											<span
												{...stylex.props(
													styles.tokenName,
												)}
											>
												{token.name}
											</span>
											<span
												{...stylex.props(
													styles.tokenValue,
												)}
											>
												{token.value}
											</span>
											<span
												{...stylex.props(
													styles.tokenUsage,
												)}
											>
												{token.usage}
											</span>
										</div>
									))}
								</div>
							</div>

							<div {...stylex.props(styles.panel)}>
								<h3 {...stylex.props(styles.subsectionTitle)}>
									Spacing
								</h3>
								<div {...stylex.props(styles.scaleList)}>
									{spacingTokens.map(token => (
										<div
											key={token.name}
											{...stylex.props(styles.scaleRow)}
										>
											<span
												{...stylex.props(
													styles.tokenName,
												)}
											>
												{token.name}
											</span>
											<span
												{...stylex.props(
													styles.scaleBar,
													styles.scaleBarWidth(
														token.value,
													),
												)}
											/>
											<span
												{...stylex.props(
													styles.tokenValue,
												)}
											>
												{token.value}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>

						<div {...stylex.props(styles.panel)}>
							<h3 {...stylex.props(styles.subsectionTitle)}>
								Radius
							</h3>
							<div {...stylex.props(styles.radiusGrid)}>
								{radiusTokens.map(token => (
									<div
										key={token.name}
										{...stylex.props(styles.radiusToken)}
									>
										<div
											{...stylex.props(
												styles.radiusPreview,
												styles.radiusPreviewValue(
													token.value,
												),
											)}
										/>
										<span
											{...stylex.props(styles.tokenName)}
										>
											{token.name}
										</span>
										<span
											{...stylex.props(styles.tokenValue)}
										>
											{token.value}
										</span>
									</div>
								))}
							</div>
						</div>
					</section>

					<section {...stylex.props(styles.section)} id='decisions'>
						<div {...stylex.props(styles.sectionHeader)}>
							<p {...stylex.props(styles.eyebrow)}>Notes</p>
							<h2 {...stylex.props(styles.sectionTitle)}>
								Current decisions
							</h2>
						</div>
						<div
							{...stylex.props(styles.panel, styles.decisionList)}
						>
							<p {...stylex.props(styles.decisionText)}>
								Document only shipped{' '}
								<code {...stylex.props(styles.inlineCode)}>
									web-v2
								</code>{' '}
								foundations on this page.
							</p>
							<p {...stylex.props(styles.decisionText)}>
								Use StyleX for authored component styles and
								Base UI only when accessible behavior is needed.
							</p>
							<p {...stylex.props(styles.decisionText)}>
								Add shared primitives only after repeated
								product usage proves the abstraction.
							</p>
						</div>
					</section>
				</article>

				<aside
					aria-label='Design system status'
					{...stylex.props(styles.rail)}
				>
					<div {...stylex.props(styles.railPanel)}>
						<p {...stylex.props(styles.railLabel)}>Route</p>
						<code {...stylex.props(styles.railCode)}>
							/design-system
						</code>
					</div>
					<div {...stylex.props(styles.railPanel)}>
						<p {...stylex.props(styles.railLabel)}>Availability</p>
						<p {...stylex.props(styles.railValue)}>Vite dev only</p>
					</div>
					<div {...stylex.props(styles.railPanel)}>
						<p {...stylex.props(styles.railLabel)}>
							Primitive count
						</p>
						<p {...stylex.props(styles.railValue)}>0</p>
					</div>
				</aside>
			</div>
		</main>
	)
}
