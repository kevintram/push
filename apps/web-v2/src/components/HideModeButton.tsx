import * as stylex from '@stylexjs/stylex'
import { Copy } from 'lucide-react'

import { useHideMode } from '~/stores/HideMode'
import { colors } from '~/styles/colors.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import { Button } from './ui'

const styles = stylex.create({
	item: {
		borderRadius: radii.xl,
		gap: spacing.sm,
		paddingBlock: spacing.sm,
		paddingInline: spacing.sm,
		alignItems: 'center',
		blockSize: 'auto',
		display: 'flex',
		flexDirection: 'column',
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,
		textAlign: 'center',
		whiteSpace: 'normal',
	},
	hideModeOn: {
		backgroundColor: {
			default: colors.bgSurfaceInfo,
			':hover': colors.bgSurfaceInfoHover,
		},
		color: colors.textInfo,
	},
	hideModeOff: {
		backgroundColor: {
			default: colors.bg,
			':hover': colors.navBgSurfaceHover,
		},
		color: colors.textLink,
	},
	icon: {
		display: 'block',
	},
})

export function HideModeButton() {
	const { hideMode, toggleHideMode } = useHideMode()

	return (
		<Button
			onClick={toggleHideMode}
			xstyle={[
				styles.item,
				hideMode === 'on' ? styles.hideModeOn : styles.hideModeOff,
			]}
			variant='outline'
		>
			<Copy {...stylex.props(styles.icon)} size={iconSizes.md} />
			Hide Mode
		</Button>
	)
}
