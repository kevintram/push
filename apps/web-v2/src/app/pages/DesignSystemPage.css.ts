import { globalStyle, style } from '@vanilla-extract/css'
import { vars } from '~/styles/theme.css'

export const page = style({
	minHeight: '100%',
	minWidth: 0,
	display: 'grid',
	gridTemplateColumns: '280px minmax(0, 1fr)',
	background: vars.color.background,
	color: vars.color.foreground,
	'@media': {
		'(max-width: 900px)': {
			gridTemplateColumns: '1fr'
		}
	}
})

export const sidebar = style({
	position: 'sticky',
	top: 0,
	height: '100vh',
	minWidth: 0,
	padding: vars.space[5],
	borderRight: `1px solid ${vars.color.border}`,
	background: vars.color.background,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[6],
	'@media': {
		'(max-width: 900px)': {
			position: 'relative',
			height: 'auto',
			borderRight: 0,
			borderBottom: `1px solid ${vars.color.border}`,
			paddingBlock: vars.space[4]
		}
	}
})

export const sidebarHeader = style({
	display: 'flex',
	alignItems: 'center',
	gap: vars.space[3]
})

export const mark = style({
	width: 40,
	height: 40,
	borderRadius: vars.radius.lg,
	background: vars.color.foreground,
	color: vars.color.background,
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.bold,
	lineHeight: 1
})

export const sidebarEyebrow = style({
	margin: 0,
	color: vars.color.mutedForeground,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	lineHeight: 1.25
})

export const sidebarTitle = style({
	margin: 0,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	lineHeight: 1.2
})

export const navList = style({
	minWidth: 0,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[1],
	'@media': {
		'(max-width: 900px)': {
			flexDirection: 'row',
			overflowX: 'auto',
			paddingBottom: vars.space[1]
		}
	}
})

export const navLink = style({
	minHeight: 36,
	paddingInline: vars.space[3],
	borderRadius: vars.radius.md,
	color: vars.color.mutedForeground,
	display: 'inline-flex',
	alignItems: 'center',
	textDecoration: 'none',
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	whiteSpace: 'nowrap',
	transition: 'background-color 150ms ease, color 150ms ease',
	selectors: {
		'&:hover': {
			background: vars.color.surfaceHover,
			color: vars.color.foreground
		},
		'&:focus-visible': {
			outline: `2px solid ${vars.color.focusRing}`,
			outlineOffset: 2
		}
	},
	'@media': {
		'(max-width: 640px)': {
			paddingInline: vars.space[2]
		}
	}
})

export const contentGrid = style({
	width: '100%',
	minWidth: 0,
	maxWidth: 1280,
	marginInline: 'auto',
	padding: vars.space[5],
	display: 'grid',
	gridTemplateColumns: 'minmax(0, 1fr) 220px',
	gap: vars.space[6],
	'@media': {
		'(max-width: 1100px)': {
			gridTemplateColumns: '1fr'
		},
		'(max-width: 640px)': {
			padding: vars.space[4]
		}
	}
})

export const content = style({
	minWidth: 0,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[6]
})

export const hero = style({
	paddingBlock: vars.space[6],
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[5],
	borderBottom: `1px solid ${vars.color.border}`
})

export const eyebrow = style({
	margin: 0,
	color: vars.color.mutedForeground,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	letterSpacing: 0,
	textTransform: 'uppercase'
})

export const heroCopy = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[3]
})

export const heroTitle = style({
	margin: 0,
	maxWidth: 760,
	fontSize: '4rem',
	fontWeight: vars.fontWeight.bold,
	letterSpacing: 0,
	lineHeight: 0.95,
	overflowWrap: 'anywhere',
	'@media': {
		'(max-width: 640px)': {
			fontSize: '2.75rem'
		}
	}
})

export const heroText = style({
	margin: 0,
	maxWidth: 680,
	color: vars.color.mutedForeground,
	fontSize: vars.fontSize.lg,
	lineHeight: 1.55
})

export const statusRow = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space[2]
})

export const statusPill = style({
	minHeight: 28,
	paddingInline: vars.space[3],
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.md,
	background: vars.color.surface,
	color: vars.color.foreground,
	display: 'inline-flex',
	alignItems: 'center',
	gap: vars.space[2],
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	lineHeight: 1
})

globalStyle(`${statusPill} svg`, {
	width: 16,
	height: 16,
	color: vars.color.focusRing
})

export const section = style({
	scrollMarginTop: vars.space[5],
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[5]
})

export const sectionHeader = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[2]
})

export const sectionTitle = style({
	margin: 0,
	fontSize: '2rem',
	fontWeight: vars.fontWeight.bold,
	letterSpacing: 0,
	lineHeight: 1.1
})

export const sectionText = style({
	margin: 0,
	maxWidth: 720,
	color: vars.color.mutedForeground,
	fontSize: vars.fontSize.md,
	lineHeight: 1.6
})

export const inlineCode = style({
	paddingInline: vars.space[1],
	borderRadius: vars.radius.sm,
	background: vars.color.surfaceHover,
	color: vars.color.foreground,
	fontSize: '0.92em'
})

export const foundationGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
	gap: vars.space[3],
	'@media': {
		'(max-width: 860px)': {
			gridTemplateColumns: '1fr'
		}
	}
})

export const foundationCard = style({
	padding: vars.space[4],
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.lg,
	background: vars.color.surface,
	display: 'flex',
	gap: vars.space[3]
})

export const foundationIcon = style({
	width: 36,
	height: 36,
	borderRadius: vars.radius.md,
	background: vars.color.surfaceHover,
	color: vars.color.focusRing,
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0
})

globalStyle(`${foundationIcon} svg`, {
	width: 18,
	height: 18
})

export const cardTitle = style({
	margin: 0,
	fontSize: vars.fontSize.md,
	fontWeight: vars.fontWeight.bold,
	lineHeight: 1.3
})

export const cardText = style({
	margin: `${vars.space[1]} 0 0`,
	color: vars.color.mutedForeground,
	fontSize: vars.fontSize.sm,
	lineHeight: 1.5
})

export const tokenSection = style({
	padding: vars.space[4],
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.lg,
	background: vars.color.surface,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[4]
})

export const subsectionTitle = style({
	margin: 0,
	fontSize: vars.fontSize.lg,
	fontWeight: vars.fontWeight.bold,
	lineHeight: 1.25
})

export const colorGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
	gap: vars.space[3],
	'@media': {
		'(max-width: 760px)': {
			gridTemplateColumns: '1fr'
		}
	}
})

export const colorToken = style({
	minWidth: 0,
	display: 'grid',
	gridTemplateColumns: '56px minmax(0, 1fr)',
	gap: vars.space[3],
	alignItems: 'center'
})

export const swatch = style({
	width: 56,
	height: 56,
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.md
})

export const tokenMeta = style({
	minWidth: 0,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[1]
})

export const tokenName = style({
	color: vars.color.foreground,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium,
	lineHeight: 1.25
})

export const tokenValue = style({
	color: vars.color.mutedForeground,
	fontSize: vars.fontSize.sm,
	fontFamily:
		'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
	lineHeight: 1.35,
	overflowWrap: 'anywhere'
})

export const tokenUsage = style({
	color: vars.color.mutedForeground,
	fontSize: vars.fontSize.sm,
	lineHeight: 1.35
})

export const table = style({
	display: 'grid',
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.md,
	overflow: 'hidden'
})

export const tableRow = style({
	minWidth: 0,
	padding: vars.space[3],
	display: 'grid',
	gridTemplateColumns: '180px minmax(0, 1fr) minmax(0, 1fr)',
	gap: vars.space[3],
	alignItems: 'center',
	selectors: {
		'& + &': {
			borderTop: `1px solid ${vars.color.border}`
		}
	},
	'@media': {
		'(max-width: 760px)': {
			gridTemplateColumns: '1fr'
		}
	}
})

export const splitGrid = style({
	display: 'grid',
	gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
	gap: vars.space[4],
	'@media': {
		'(max-width: 860px)': {
			gridTemplateColumns: '1fr'
		}
	}
})

export const scaleList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[3]
})

export const scaleRow = style({
	display: 'grid',
	gridTemplateColumns: '80px minmax(48px, 1fr) 72px',
	gap: vars.space[3],
	alignItems: 'center'
})

export const scaleBar = style({
	height: 12,
	minWidth: 4,
	borderRadius: vars.radius.sm,
	background: vars.color.focusRing
})

export const radiusGrid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
	gap: vars.space[3],
	'@media': {
		'(max-width: 640px)': {
			gridTemplateColumns: '1fr'
		}
	}
})

export const radiusToken = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[2]
})

export const radiusPreview = style({
	height: 52,
	border: `1px solid ${vars.color.border}`,
	background: vars.color.surfaceHover
})

export const componentPanel = style({
	padding: vars.space[4],
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.lg,
	background: vars.color.surface,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[5]
})

export const componentPanelHeader = style({
	display: 'flex',
	justifyContent: 'space-between',
	gap: vars.space[4],
	alignItems: 'flex-start',
	'@media': {
		'(max-width: 640px)': {
			flexDirection: 'column'
		}
	}
})

export const buttonMatrix = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space[3],
	alignItems: 'center',
	overflowX: 'auto',
	paddingBottom: vars.space[1]
})

export const matrixLabel = style({
	color: vars.color.mutedForeground,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium
})

export const codeBlock = style({
	padding: vars.space[3],
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.md,
	background: vars.color.surfaceHover,
	display: 'flex',
	alignItems: 'center',
	gap: vars.space[2],
	color: vars.color.foreground,
	fontSize: vars.fontSize.sm,
	overflowX: 'auto'
})

globalStyle(`${codeBlock} svg`, {
	width: 16,
	height: 16,
	color: vars.color.focusRing,
	flexShrink: 0
})

globalStyle(`${codeBlock} code`, {
	fontFamily:
		'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
	whiteSpace: 'nowrap'
})

export const decisionList = style({
	padding: vars.space[4],
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.lg,
	background: vars.color.surface,
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[3],
	color: vars.color.mutedForeground,
	lineHeight: 1.6
})

globalStyle(`${decisionList} p`, {
	margin: 0
})

export const rail = style({
	position: 'sticky',
	top: vars.space[5],
	height: 'max-content',
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space[3],
	'@media': {
		'(max-width: 1100px)': {
			display: 'none'
		}
	}
})

export const railPanel = style({
	padding: vars.space[3],
	border: `1px solid ${vars.color.border}`,
	borderRadius: vars.radius.lg,
	background: vars.color.surface
})

export const railLabel = style({
	margin: 0,
	color: vars.color.mutedForeground,
	fontSize: vars.fontSize.sm,
	fontWeight: vars.fontWeight.medium
})

export const railCode = style({
	marginTop: vars.space[2],
	display: 'block',
	color: vars.color.foreground,
	fontSize: vars.fontSize.sm,
	fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
})

export const railValue = style({
	margin: `${vars.space[2]} 0 0`,
	color: vars.color.foreground,
	fontSize: vars.fontSize.md,
	fontWeight: vars.fontWeight.medium
})
