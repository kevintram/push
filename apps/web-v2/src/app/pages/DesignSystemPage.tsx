import { Check, Code2, Component, Layers3, Palette, Ruler } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import * as styles from './DesignSystemPage.css'

const foundationSections = [
	{
		id: 'color',
		label: 'Color',
		icon: Palette,
		description: 'Application surfaces, text, borders, and interaction color.'
	},
	{
		id: 'typography',
		label: 'Typography',
		icon: Layers3,
		description: 'Font family, size, and weight tokens currently available.'
	},
	{
		id: 'spacing',
		label: 'Spacing',
		icon: Ruler,
		description: 'The compact spacing scale used by the app shell and controls.'
	}
]

const colorTokens = [
	{
		name: 'background',
		value: 'oklch(97.00% 0.0082 91.48)',
		usage: 'Page background'
	},
	{ name: 'foreground', value: 'oklch(20.46% 0 none)', usage: 'Primary text' },
	{
		name: 'primary',
		value: 'oklch(20.46% 0 none)',
		usage: 'Default button fill'
	},
	{
		name: 'primaryForeground',
		value: 'oklch(97.00% 0.0082 91.48)',
		usage: 'Text on primary'
	},
	{
		name: 'primaryHover',
		value: 'oklch(28.50% 0 none)',
		usage: 'Primary hover fill'
	},
	{
		name: 'secondary',
		value: 'oklch(92.81% 0.0153 90.24)',
		usage: 'Secondary button fill'
	},
	{
		name: 'secondaryForeground',
		value: 'oklch(20.46% 0 none)',
		usage: 'Text on secondary'
	},
	{
		name: 'secondaryHover',
		value: 'oklch(90.40% 0.0183 89.37)',
		usage: 'Secondary hover fill'
	},
	{
		name: 'muted',
		value: 'oklch(94.90% 0.0083 91.48)',
		usage: 'Subtle interactive fill'
	},
	{
		name: 'mutedForeground',
		value: 'oklch(50.28% 0.0112 93.69)',
		usage: 'Secondary text'
	},
	{
		name: 'destructive',
		value: 'oklch(50.03% 0.1821 29.51)',
		usage: 'Destructive actions'
	},
	{
		name: 'destructiveForeground',
		value: 'oklch(98.18% 0.0090 34.30)',
		usage: 'Text on destructive'
	},
	{
		name: 'destructiveMuted',
		value: 'oklch(92.05% 0.0297 30.64)',
		usage: 'Low-emphasis destructive fill'
	},
	{ name: 'surface', value: 'oklch(100.00% 0 none)', usage: 'Raised surfaces' },
	{
		name: 'surfaceHover',
		value: 'oklch(94.90% 0.0083 91.48)',
		usage: 'Subtle hover fill'
	},
	{
		name: 'border',
		value: 'oklch(88.59% 0.0171 88.01)',
		usage: 'Dividers and outlines'
	},
	{
		name: 'input',
		value: 'oklch(92.81% 0.0153 90.24)',
		usage: 'Input and control borders'
	},
	{
		name: 'focusRing',
		value: 'oklch(50.15% 0.0845 168.71)',
		usage: 'Keyboard focus'
	}
]

const buttonVariantSamples = [
	{ label: 'Default', variant: 'default' as const },
	{ label: 'Outline', variant: 'outline' as const },
	{ label: 'Secondary', variant: 'secondary' as const },
	{ label: 'Ghost', variant: 'ghost' as const },
	{ label: 'Destructive', variant: 'destructive' as const },
	{ label: 'Link', variant: 'link' as const }
]

const buttonSizeSamples = [
	{ label: 'xs', size: 'xs' as const },
	{ label: 'sm', size: 'sm' as const },
	{ label: 'default', size: 'default' as const },
	{ label: 'lg', size: 'lg' as const }
]

const typographyTokens = [
	{
		name: 'font.family',
		value: 'Inter, ui-sans-serif, system-ui',
		usage: 'Default interface typeface'
	},
	{ name: 'fontSize.sm', value: '0.875rem', usage: 'Compact labels' },
	{ name: 'fontSize.md', value: '1rem', usage: 'Body text' },
	{ name: 'fontSize.lg', value: '1.125rem', usage: 'Introductory copy' },
	{ name: 'fontWeight.regular', value: '400', usage: 'Body copy' },
	{ name: 'fontWeight.medium', value: '500', usage: 'Controls and labels' },
	{ name: 'fontWeight.bold', value: '750', usage: 'Headings' }
]

const spacingTokens = [
	{ name: 'space.1', value: '0.25rem' },
	{ name: 'space.2', value: '0.5rem' },
	{ name: 'space.3', value: '0.75rem' },
	{ name: 'space.4', value: '1rem' },
	{ name: 'space.5', value: '1.5rem' },
	{ name: 'space.6', value: '2rem' }
]

const radiusTokens = [
	{ name: 'radius.sm', value: '4px' },
	{ name: 'radius.md', value: '6px' },
	{ name: 'radius.lg', value: '8px' }
]

const navItems = [
	{ href: '#overview', label: 'Overview' },
	{ href: '#foundations', label: 'Foundations' },
	{ href: '#button', label: 'Button' },
	{ href: '#decisions', label: 'Decisions' }
]

export function DesignSystemPage() {
	return (
		<main className={styles.page}>
			<aside aria-label='Design system navigation' className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<div className={styles.mark}>3g</div>
					<div>
						<p className={styles.sidebarEyebrow}>web-v2</p>
						<h1 className={styles.sidebarTitle}>Design System</h1>
					</div>
				</div>
				<nav className={styles.navList}>
					{navItems.map(item => (
						<a className={styles.navLink} href={item.href} key={item.href}>
							{item.label}
						</a>
					))}
				</nav>
			</aside>

			<div className={styles.contentGrid}>
				<article className={styles.content}>
					<section className={styles.hero} id='overview'>
						<p className={styles.eyebrow}>Internal workbench</p>
						<div className={styles.heroCopy}>
							<h2 className={styles.heroTitle}>3gulp design system</h2>
							<p className={styles.heroText}>
								A dev-only reference for the primitives that exist in
								<code className={styles.inlineCode}> apps/web-v2</code> today.
								This page should grow only when the implementation grows.
							</p>
						</div>
						<div className={styles.statusRow}>
							<span className={styles.statusPill}>
								<Check aria-hidden='true' />
								DEV only
							</span>
							<span className={styles.statusPill}>Base UI</span>
							<span className={styles.statusPill}>vanilla-extract</span>
						</div>
					</section>

					<section className={styles.section} id='foundations'>
						<div className={styles.sectionHeader}>
							<p className={styles.eyebrow}>Foundations</p>
							<h2 className={styles.sectionTitle}>Current tokens</h2>
							<p className={styles.sectionText}>
								These values mirror the active tokens in
								<code className={styles.inlineCode}> theme.css.ts</code>.
							</p>
						</div>

						<div className={styles.foundationGrid}>
							{foundationSections.map(section => {
								const Icon = section.icon
								return (
									<div className={styles.foundationCard} key={section.id}>
										<div className={styles.foundationIcon}>
											<Icon aria-hidden='true' />
										</div>
										<div>
											<h3 className={styles.cardTitle}>{section.label}</h3>
											<p className={styles.cardText}>{section.description}</p>
										</div>
									</div>
								)
							})}
						</div>

						<div className={styles.tokenSection} id='color'>
							<h3 className={styles.subsectionTitle}>Color</h3>
							<div className={styles.colorGrid}>
								{colorTokens.map(token => (
									<div className={styles.colorToken} key={token.name}>
										<div
											aria-label={`${token.name} ${token.value}`}
											className={styles.swatch}
											style={{ backgroundColor: token.value }}
										/>
										<div className={styles.tokenMeta}>
											<span className={styles.tokenName}>{token.name}</span>
											<span className={styles.tokenValue}>{token.value}</span>
											<span className={styles.tokenUsage}>{token.usage}</span>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className={styles.tokenSection} id='typography'>
							<h3 className={styles.subsectionTitle}>Typography</h3>
							<div className={styles.table}>
								{typographyTokens.map(token => (
									<div className={styles.tableRow} key={token.name}>
										<span className={styles.tokenName}>{token.name}</span>
										<span className={styles.tokenValue}>{token.value}</span>
										<span className={styles.tokenUsage}>{token.usage}</span>
									</div>
								))}
							</div>
						</div>

						<div className={styles.splitGrid}>
							<div className={styles.tokenSection} id='spacing'>
								<h3 className={styles.subsectionTitle}>Spacing</h3>
								<div className={styles.scaleList}>
									{spacingTokens.map(token => (
										<div className={styles.scaleRow} key={token.name}>
											<span className={styles.tokenName}>{token.name}</span>
											<span
												className={styles.scaleBar}
												style={{ width: token.value }}
											/>
											<span className={styles.tokenValue}>{token.value}</span>
										</div>
									))}
								</div>
							</div>

							<div className={styles.tokenSection}>
								<h3 className={styles.subsectionTitle}>Radius</h3>
								<div className={styles.radiusGrid}>
									{radiusTokens.map(token => (
										<div className={styles.radiusToken} key={token.name}>
											<div
												className={styles.radiusPreview}
												style={{ borderRadius: token.value }}
											/>
											<span className={styles.tokenName}>{token.name}</span>
											<span className={styles.tokenValue}>{token.value}</span>
										</div>
									))}
								</div>
							</div>
						</div>
					</section>

					<section className={styles.section} id='button'>
						<div className={styles.sectionHeader}>
							<p className={styles.eyebrow}>Component</p>
							<h2 className={styles.sectionTitle}>Button</h2>
							<p className={styles.sectionText}>
								The only shared primitive currently implemented in
								<code className={styles.inlineCode}> components/ui</code>.
							</p>
						</div>

						<div className={styles.componentPanel}>
							<div className={styles.componentPanelHeader}>
								<div>
									<h3 className={styles.cardTitle}>Variants and states</h3>
									<p className={styles.cardText}>
										The shared primitive follows the shadcn variant and size API
										on top of Base UI.
									</p>
								</div>
								<span className={styles.statusPill}>
									<Component aria-hidden='true' />
									Stable
								</span>
							</div>

							<div className={styles.buttonMatrix}>
								{buttonVariantSamples.map(sample => (
									<Button key={sample.variant} variant={sample.variant}>
										{sample.label}
									</Button>
								))}
								<Button disabled={true}>Disabled</Button>
								<Button aria-invalid={true} variant='outline'>
									Invalid
								</Button>
							</div>

							<div className={styles.buttonMatrix}>
								{buttonSizeSamples.map(sample => (
									<Button
										key={sample.size}
										size={sample.size}
										variant='outline'
									>
										{sample.label}
									</Button>
								))}
								<Button aria-label='Default icon' size='icon' variant='outline'>
									<Component aria-hidden='true' />
								</Button>
								<Button
									aria-label='Extra small icon'
									size='icon-xs'
									variant='outline'
								>
									<Component aria-hidden='true' />
								</Button>
								<Button
									aria-label='Small icon'
									size='icon-sm'
									variant='outline'
								>
									<Component aria-hidden='true' />
								</Button>
								<Button
									aria-label='Large icon'
									size='icon-lg'
									variant='outline'
								>
									<Component aria-hidden='true' />
								</Button>
							</div>

							<div className={styles.codeBlock}>
								<Code2 aria-hidden='true' />
								<code>import {'{ Button }'} from '~/components/ui/Button'</code>
							</div>
						</div>
					</section>

					<section className={styles.section} id='decisions'>
						<div className={styles.sectionHeader}>
							<p className={styles.eyebrow}>Notes</p>
							<h2 className={styles.sectionTitle}>Current decisions</h2>
						</div>
						<div className={styles.decisionList}>
							<p>
								Document only shipped{' '}
								<code className={styles.inlineCode}>web-v2</code>
								primitives on this page.
							</p>
							<p>
								Use Base UI for accessible behavior and vanilla-extract recipes
								for typed variants.
							</p>
							<p>
								Keep component pages compact: purpose, variants, states, and
								import path before longer guidance.
							</p>
						</div>
					</section>
				</article>

				<aside aria-label='Design system status' className={styles.rail}>
					<div className={styles.railPanel}>
						<p className={styles.railLabel}>Route</p>
						<code className={styles.railCode}>/design-system</code>
					</div>
					<div className={styles.railPanel}>
						<p className={styles.railLabel}>Availability</p>
						<p className={styles.railValue}>Vite dev only</p>
					</div>
					<div className={styles.railPanel}>
						<p className={styles.railLabel}>Primitive count</p>
						<p className={styles.railValue}>1</p>
					</div>
				</aside>
			</div>
		</main>
	)
}
