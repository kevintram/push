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
		color: colors.textLink,
	},
	icon: {
		blockSize: iconSizes.md,
		display: 'block',
		inlineSize: iconSizes.md,
	},
})

export function ReviewModeItem() {
	const { hideMode, toggleHideMode } = useHideMode()

	return (
		<Button
			onClick={toggleHideMode}
			prefix={<Copy {...stylex.props(styles.icon)} />}
			xstyle={[
				styles.item,
				hideMode === 'on' ? styles.hideModeOn : styles.hideModeOff,
			]}
			variant={'ghost'}
		>
			Hide Mode
		</Button>
	)
}
